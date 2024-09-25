import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Comment } from 'src/comment.entity';
import { Folder } from 'src/folder.entity';
import { User } from 'src/user.entity';
import { NotificationService } from './notification.service';
import { Admin } from 'src/admin.entity';
import { Report } from 'src/report.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Folder)
    private folderRepository: Repository<Folder>,
    private notificationService: NotificationService,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  
  ) { }

  async addComment(folderId: number, userId: number, content: string): Promise<Comment> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const folder = await this.folderRepository.findOne({ 
        where: { id: folderId },
        relations: ['user'], 
      });
  
      if (!user || !folder) {
      //  console.error('User or Folder not found', { userId, folderId });
        throw new Error('User or Folder not found');
      }
  
      // Create and save the comment
      const comment = new Comment();
      comment.content = content;
      comment.user = user;
      comment.folder = folder;
  
      const savedComment = await this.commentRepository.save(comment);
  
      // Notify the folder owner about the new comment
      if (folder.user.id !== userId) {
        const userName = user.username;
        const folderName = folder.title;
        
        // Notify only the owner of the folder
        await this.notificationService.createNotifForComment(
          folder.user.id, // Notify the owner of the folder
          `Nouveau commentaire de ${userName} sur votre poste ${folderName}`,
          savedComment.id
        );
      }
  
      return savedComment;
    } catch (error) {
     // console.error('Error in addComment:', error);
      throw error;
    }
  }
  


  //fetch comments
  async getCommentsByFolderId(folderId: number): Promise<Comment[]> {
    try {
      const comments = await this.commentRepository.find({
        where: { folder: { id: folderId } },
        relations: ['user', 'replies', 'replies.user'],
        order: { createdAt: 'ASC' }, 
      });
      return comments;
    } catch (error) {
     // console.error('Error fetching comments:', error.message);
      throw new Error('Failed to fetch comments');
    }
  }


  async addReply(commentId: number, content: string, userId: number): Promise<Comment> {
    const parentComment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['folder', 'user']
    });


    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }

    const mentionMatch = content.match(/@(\w+)/);
    let mentionedUser = null;
    let mentionedUserId = null;

    if (mentionMatch) {
      const mentionedUsername = mentionMatch[1];
      mentionedUser = await this.userRepository.findOne({ where: { username: mentionedUsername } });
      if (mentionedUser) {
        mentionedUserId = mentionedUser.id;
      }
    }

    const reply = this.commentRepository.create({
      content,
      user: { id: userId },
      parent: parentComment
    });
    const savedReply = await this.commentRepository.save(reply);

    const replier = await this.userRepository.findOne({ where: { id: userId } });

    if (parentComment.folder && parentComment.folder.user && parentComment.folder.user.id !== userId) {
      await this.notificationService.createNotifForFolder(
        `Nouveau commentaire de ${replier?.username} sur votre poste ${parentComment.folder.title}`,
        parentComment.folder.id,
        parentComment.folder.user.id
      );
    }

    if (parentComment.user && parentComment.user.id !== userId) {
      await this.notificationService.createNotifForReply(
        `Nouveau commentaire de ${replier?.username} en réponse à votre commentaire`,
        parentComment.id
      );
    }

    if (mentionedUser && mentionedUser.id !== userId && mentionedUser.id !== parentComment.user?.id) {
      await this.notificationService.createNotifForMention(
        `Vous avez été mentionné dans un commentaire par ${replier?.username}`,
        parentComment.id,
        mentionedUserId
      );
    }

    return savedReply;
  }

  async updateComment(userId: number, id: number, folderId: number, content: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: id },
      relations: ['user', 'folder', 'parent', 'replies'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found in the specified folder');
    }

    if (comment.user.id !== userId) {
      throw new ForbiddenException('You are not allowed to edit this comment');
    }

    comment.content = content;
    await this.commentRepository.save(comment);
    return comment;
    
  }

  async deleteComment(commentId: number, userId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'folder']
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    await this.commentRepository.remove(comment);
  }

  async updateReply(userId: number, id: number, folderId: number, content: string): Promise<Comment> {
    const reply = await this.commentRepository.findOne({
      where: { id: id },
      relations: ['user', 'folder', 'parent', 'replies'],
    });

    if (!reply) {
      throw new NotFoundException('Reply not found in the specified folder');
    }

    if (reply.user.id !== userId) {
      throw new ForbiddenException('You are not allowed to edit this reply');
    }

    reply.content = content;
    await this.commentRepository.save(reply);
    return reply;
  }

  async deleteReply(replyId: number, userId: number): Promise<void> {
    const reply = await this.commentRepository.findOne({
      where: { id: replyId },
      relations: ['user', 'parent'],
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    if (reply.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this reply');
    }

    await this.commentRepository.remove(reply);
  }


  getUserComment(id: number): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { user: { id: id } },
      relations: ['folder']
    })
  }

  async findUsersByPrefix(prefix: string): Promise<User[]> {
    const users = await this.userRepository.find({
      where: { username: Like(`${prefix}%`) }
    });
    return users;
  }

}
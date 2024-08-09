import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Comment } from 'src/comment.entity';
import { Folder } from 'src/folder.entity';
import { User } from 'src/user.entity';
import { NotificationService } from './notification.service';

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


  ) { }


  async addComment(folderId: number, userId: number, content: string): Promise<Comment> {
    try {
      // Fetch user and folder, including the user relation in the folder
      const user = await this.userRepository.findOne({ where: { id: userId } });
      const folder = await this.folderRepository.findOne({ 
        where: { id: folderId },
        relations: ['user'],  // Ensure the 'user' relation is loaded
      });
  
      if (!user || !folder) {
        console.error('User or Folder not found', { userId, folderId });
        throw new Error('User or Folder not found');
      }
  
      // Log fetched user and folder
      console.log('Fetched User:', user);
      console.log('Fetched Folder:', folder);
  
      // Create and save the comment
      const comment = new Comment();
      comment.content = content;
      comment.user = user;
      comment.folder = folder;
  
      const savedComment = await this.commentRepository.save(comment);
  
      // Notify other users (excluding the folder owner) about the new comment
      if (folder.user.id !== userId) {
        const userName = user.username;
        const folderName = folder.category;
  
        await this.notificationService.createNotifForComment(
          `Nouveau commentaire de ${userName} sur votre poste ${folderName}`,
          savedComment.id
        );
      }
  
      return savedComment;
    } catch (error) {
      console.error('Error in addComment:', error);
      throw error;
    }
  }
  



  //fetch comments
  async getCommentsByFolderId(folderId: number): Promise<Comment[]> {
    try {
      const comments = await this.commentRepository.find({
        where: { folder: { id: folderId } },
        relations: ['user', 'replies', 'replies.user'],
        order: { createdAt: 'ASC' }, // Optionally sort comments by creation date
      });
      return comments;
    } catch (error) {
      console.error('Error fetching comments:', error.message);
      throw new Error('Failed to fetch comments');
    }
  }



  // async addReply(commentId: number, content: string, userId: number): Promise<Comment> {
  //   const parentComment = await this.commentRepository.findOne({ where: { id: commentId } });
  //   if (!parentComment) {
  //     throw new NotFoundException('Parent comment not found');
  //   }

  //   // Extract mentioned username if it exists
  //   const mentionMatch = content.match(/@(\w+)/);
  //   let mentionedUser = null;

  //   if (mentionMatch) {
  //     const mentionedUsername = mentionMatch[1];
  //     mentionedUser = await this.userRepository.findOne({ where: { username: mentionedUsername } });
  //     if (!mentionedUser) {
  //       // Optionally handle the case where the mentioned user does not exist
  //       console.warn(`Mentioned user ${mentionedUsername} not found.`);
  //     }
  //   }

  //   const reply = this.commentRepository.create({
  //     content,
  //     user: { id: userId },
  //     parent: parentComment,
  //     folder: parentComment.folder  // Ensure the folder is also set correctly
  //   });
  //   const savedReply = await this.commentRepository.save(reply);

  //   // Fetch the user and folder names for the notification message
  //   const userName = parentComment.user.username;
  //   const folderName = parentComment.folder.category;
  //   await this.notificationService.createNotifForComment(`Nouveau commentaire de ${userName} sur votre poste ${folderName}`, parentComment.id);

  //   return savedReply;
  // }

  async addReply(commentId: number, content: string, userId: number): Promise<Comment> {
    // Fetch the parent comment along with its related user and folder
    const parentComment = await this.commentRepository.findOne({ 
      where: { id: commentId }, 
      relations: ['folder', 'user'] 
    });
    console.log('Parent Comment:', parentComment);
    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }
  
    // Extract mentioned username from the reply content if it exists
    const mentionMatch = content.match(/@(\w+)/);
    let mentionedUser = null;
  
    if (mentionMatch) {
      const mentionedUsername = mentionMatch[1];
      mentionedUser = await this.userRepository.findOne({ where: { username: mentionedUsername } });
      if (!mentionedUser) {
        console.warn(`Mentioned user ${mentionedUsername} not found.`);
      }
    }
  
    // Create a new reply associated with the parent comment and user
    const reply = this.commentRepository.create({
      content,
      user: { id: userId },
      parent: parentComment,
     // folder: parentComment.folder
    });
    console.log('Reply to be saved:', reply);
    const savedReply = await this.commentRepository.save(reply);
    console.log('Saved Reply:', savedReply);
    
    const replier = await this.userRepository.findOne({ where: { id: userId } });

    // Notify the folder owner if the reply is not from them
    if (parentComment.folder && parentComment.folder.user && parentComment.folder.user.id !== userId) {
      console.log(`Creating notification for folder ID: ${parentComment.folder.id}`);
      await this.notificationService.createNotifForFolder(
        `Nouveau commentaire de ${replier?.username} sur votre dossier ${parentComment.folder.category}`, 
        parentComment.folder.id,
        parentComment.folder.user.id
      );
    }
  
    // Notify the comment owner if the reply is not from them
    if (parentComment.user && parentComment.user.id !== userId) {
      console.log(`Creating notification for comment ID: ${parentComment.id}`);
      await this.notificationService.createNotifForReply(
        `Nouveau commentaire de ${replier?.username} en réponse à votre commentaire`, 
        parentComment.id
      );
    }
  
    // Optionally, notify the mentioned user if they exist and are different from the replier and comment owner
    if (mentionedUser && mentionedUser.id !== userId && mentionedUser.id !== parentComment.user?.id) {
      console.log(`Creating notification for mention in comment ID: ${parentComment.id}`);
      await this.notificationService.createNotifForMention(
        `Vous avez été mentionné dans un commentaire par ${replier?.username}`,
        parentComment.id
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
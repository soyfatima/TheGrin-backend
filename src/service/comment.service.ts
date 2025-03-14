import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Comment } from 'src/comment.entity';
import { Folder } from 'src/folder.entity';
import { User } from 'src/user.entity';
import { NotificationService } from './notification.service';
import { Admin } from 'src/admin.entity';
import { Report } from 'src/report.entity';
import { CustomLogger } from 'src/logger/logger.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Folder)
    private folderRepository: Repository<Folder>,
    private notificationService: NotificationService,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly logger: CustomLogger,


  ) { }



  async addComment(folderId: number, userId: number, content: string, role: string): Promise<Comment> {
    try {
      let user: User | null = null;
      let admin: Admin | null = null;

      if (role === 'user') {
        user = await this.userRepository.findOne({ where: { id: userId } });
      } else if (role === 'admin') {
        admin = await this.adminRepository.findOne({ where: { id: userId } });
      }

      const folder = await this.folderRepository.findOne({
        where: { id: folderId },
        relations: ['user', 'admin'],
      });

      if ((!user && role === 'user') || (!admin && role === 'admin') || !folder) {
        throw new Error('User, admin, or folder not found');
      }

      // Create and save the comment
      const comment = new Comment();
      comment.content = content;

      if (role === 'user') {
        comment.user = user;
      } else if (role === 'admin') {
        comment.admin = admin;
      }
      comment.folder = folder;

      const savedComment = await this.commentRepository.save(comment);

      const commenterName = role === 'user' ? user.username : admin.username;
      const folderName = folder.title;

      if (folder.user.id !== userId) {
        await this.notificationService.createNotifForComment(
          folder.user.id,
          `Nouveau commentaire de ${commenterName} sur votre poste ${folderName}`,
          savedComment.id
        );
      }

      return savedComment;
    } catch (error) {
      this.logger.error('Error in addComment service:', error.message);
      throw new BadRequestException('Failed to add comment');
    }
  }


  //fetch comments
  async getCommentsByFolderId(folderId: number): Promise<Comment[]> {
    try {
      const comments = await this.commentRepository.find({
        where: { folder: { id: folderId } },
        relations: ['user', 'admin', 'replies', 'replies.user', 'replies.admin'],
        order: { createdAt: 'ASC' },
      });
      return comments;
    } catch (error) {
      this.logger.error('Error fetching comments:', error.message);
      throw new Error('Failed to fetch comments');
    }
  }
  async addReply(commentId: number, content: string, userId: number, role: string): Promise<Comment> {
    const parentComment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['folder', 'user', 'admin']
    });

    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }

    // Handle mention of another user
    const mentionMatch = content.match(/@(\w+)/);
    let mentionedUser = null;
    let mentionedUserId = null;

    if (mentionMatch) {
      const mentionedUsername = mentionMatch[1];
      mentionedUser = await this.userRepository.findOne({ where: { username: mentionedUsername } });
      if (mentionedUser) {
        mentionedUserId = mentionedUser.id;
      } else {
      }
    }

    // Create the reply comment
    const reply = this.commentRepository.create({
      content,
      user: role === 'admin' ? null : { id: userId },  // Assign user if not admin
      admin: role === 'admin' ? { id: userId } : null,  // Assign admin if it's an admin role
      parent: parentComment,
    //  folder: parentComment.folder,
    });

    let savedReply;
    try {
      savedReply = await this.commentRepository.save(reply);
    } catch (error) {
      this.logger.error('Error saving reply:', error);
      throw new Error('Failed to save comment: ' + error.message);
    }

    let replier: any;
    if (role === 'admin') {
      replier = await this.adminRepository.findOne({ where: { id: userId } });
    } else {
      replier = await this.userRepository.findOne({ where: { id: userId } });
    }

    if (!replier) {
      throw new NotFoundException(`Replier with id ${userId} not found`);
    }

    // Notifications for new replies
    if (parentComment.folder && parentComment.folder.user && parentComment.folder.user.id !== userId) {
      await this.notificationService.createNotifForFolder(
        `Nouveau commentaire de ${replier.username} sur votre poste ${parentComment.folder.title}`,
        parentComment.folder.id,
        parentComment.folder.user.id
      );
    }

    if (parentComment.user && parentComment.user.id !== userId) {
      await this.notificationService.createNotifForReply(
        `Nouveau commentaire de ${replier.username} en réponse à votre commentaire`,
        parentComment.id
      );
    }

    if (mentionedUser && mentionedUser.id !== userId && mentionedUser.id !== parentComment.user?.id) {
      await this.notificationService.createNotifForMention(
        `Vous avez été mentionné dans un commentaire par ${replier.username}`,
        parentComment.id,
        mentionedUserId
      );
    }

    return savedReply;
  }

  async updateComment(userId: number, id: number, folderId: number, content: string, role: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: id },
      relations: ['user', 'folder', 'parent', 'replies', 'admin'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found in the specified folder');
    }

    // if ((comment.user.id !== userId)) {
    //   throw new ForbiddenException('You are not allowed to edit this comment');
    // }
    const isOwner = comment.user && comment.user.id === userId;
    const isAdmin = role === 'admin' && comment.admin && comment.admin.id === userId;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to edit this comment');
    }

    comment.content = content;
    await this.commentRepository.save(comment);
    return comment;

  }

  async updateReply(userId: number, id: number, folderId: number, content: string, role: string): Promise<Comment> {
    const reply = await this.commentRepository.findOne({
      where: { id: id },
      relations: ['user', 'folder', 'parent', 'replies', 'admin'],
    });

    if (!reply) {
      throw new NotFoundException('Reply not found in the specified folder');
    }
    const ownerUser = reply.user && reply.user.id === userId;
    const ownerAdmin = role === 'admin' && reply.admin && reply.admin.id === userId;
    if (!ownerUser && !ownerAdmin) {
      throw new ForbiddenException('You are not allowed to edit this reply');
    }

    reply.content = content;
    await this.commentRepository.save(reply);
    return reply;
  }

  async deleteComment(commentId: number, userId: number, role: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'folder', 'admin', 'reports']
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user?.status === 'banned' || user?.blocked) {
      throw new ForbiddenException('Your account is banned and cannot perform this action');
    }

    const ownerUser = comment.user && comment.user.id === userId;
    const ownerAdmin = role === 'admin' && comment.admin && comment.admin.id === userId;

    if (!ownerUser && !ownerAdmin) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    await this.commentRepository.remove(comment);
  }

  async deleteReply(replyId: number, userId: number, role: string): Promise<void> {
    const reply = await this.commentRepository.findOne({
      where: { id: replyId },
      relations: ['user', 'admin', 'reports'],
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user?.status === 'banned' || user?.blocked) {
      throw new ForbiddenException('Your account is banned and cannot perform this action');
    }

    const ownerUser = reply.user && reply.user.id === userId;
    const isAdmin = role === 'admin';

    if (!isAdmin && !ownerUser) {
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


  /////////////////////////////////////
  /////////// for admin

  async deleteUserComment(adminId: number, commentId: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user', 'folder', 'reports'],
    });

    if (!comment) {
      throw new NotFoundException('User comment not found or has been already deleted');
    }

    const isAdmin = await this.checkIfAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can delete this comment.');
    }

    if (!commentId) {
      throw new BadRequestException('Invalid comment ID');
    }

    await this.reportRepository.delete({ comment: { id: commentId } });

    await this.commentRepository.delete(commentId);
    return comment;
  }

  async deleteUserReply(adminId: number, replyId: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: replyId },
      relations: ['user', 'folder', 'parent', 'replies', 'reports'],
    });

    if (!comment) {
      throw new NotFoundException('User reply not found or has been already deleted');
    }

    const isAdmin = await this.checkIfAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can delete this reply.');
    }

    if (!replyId) {
      throw new BadRequestException('Invalid comment ID');
    }
    await this.reportRepository.delete({ reply: { id: replyId } });

    await this.commentRepository.delete(replyId);
    return comment;
  }


  async checkIfAdmin(adminId: number): Promise<boolean> {
    const admin = await this.adminRepository.findOne({ where: { id: adminId } });
    return !!admin
  }

}
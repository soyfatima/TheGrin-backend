import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Notification } from 'src/notif.entity';
import { Order } from 'src/order.entity';
import { Comment } from 'src/comment.entity';
import { Folder } from 'src/folder.entity';
import { User } from 'src/user.entity';
import { Message } from 'src/message.entity';
import { CustomLogger } from 'src/logger/logger.service';


@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
    private readonly logger: CustomLogger,

  ) { }

  async createNotifForComment(userId: number, message: string, commentId: number): Promise<Notification> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['user', 'folder'] });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const notification = new Notification();
    notification.message = message;
    notification.comment = comment;
    notification.user = user;
    notification.folder = comment.folder;

    return this.notificationRepository.save(notification);
  }
 
  async createNotifForReply(message: string, commentId: number): Promise<Notification> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['user', 'folder'] });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const notification = new Notification();
    notification.message = message;
    notification.comment = comment;
    notification.user = comment.user; // Notify the owner of the comment
    notification.folder = comment.folder; // Include the associated folder

    return this.notificationRepository.save(notification);
  }

  async createNotifForMention(message: string, commentId: number, mentionedUserId: number): Promise<Notification> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['user', 'folder'] });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const mentionedUser = await this.userRepository.findOne({ where: { id: mentionedUserId } });
    if (!mentionedUser) {
      throw new Error('Mentioned user not found');
    }

    const notification = new Notification();
    notification.message = message;
    notification.comment = comment;
    notification.user = mentionedUser; // Notify the mentioned user
    notification.folder = comment.folder; // Include the associated folder

    return this.notificationRepository.save(notification);
  }


  async createNotifForFolder(message: string, folderId: number, userId: number): Promise<Notification> {
    const folder = await this.folderRepository.findOne({ where: { id: folderId } });
    if (!folder) {
      throw new Error('Folder not found');
    }

    const folderOwner = await this.userRepository.findOne({ where: { id: userId } });
    if (!folderOwner) {
      throw new Error('Folder owner not found');
    }

    const notification = new Notification();
    notification.message = message;
    notification.folder = folder;
    notification.user = folderOwner;

    return this.notificationRepository.save(notification);
  }

  async createNotifForOrder(message: string, id: number): Promise<Notification> {
    const order = await this.orderRepository.findOne({ where: { id } });
    const notification = this.notificationRepository.create({ message, order });
    return await this.notificationRepository.save(notification);
  }


  async getOrderNotification(): Promise<Notification[]> {
    const notifications = await this.notificationRepository.find({
      where: { order: Not(IsNull()) },
      relations: ['order'],
      order: { createdAt: 'DESC' },
    });

    return notifications;
  }

  async createNotifForWarning(userId: number, message: string): Promise<Notification> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found'); 
    }
  
    const notification = new Notification();
    notification.message = message;
    notification.user = user; 
  
    return this.notificationRepository.save(notification);
  }
  

  async getAllUserNotifications(userId: number): Promise<Notification[]> {
    try {
      const userNotifications = await this.notificationRepository.find({
        where: { user: { id: userId } },
        relations: ['comment', 'comment.user', 'comment.folder', 'user'],
      });

      return userNotifications;
    } catch (error) {
      this.logger.error('Failed to fetch notifications:', error);
      throw new Error('Unable to fetch notifications');
    }
  }


  // notification.service.ts (or equivalent service)
  async getUserNotificationById(notificationId: number): Promise<Notification> {
    return await this.notificationRepository.findOne({
      where: { id: notificationId },
      relations: ['folder', 'comment'] // Ensure related entities are included
    });
  }

  async markAsRead(id: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({ where: { id } })
    if (notification) {
      notification.read = true;

      await this.notificationRepository.save(notification)
    }
  }

  async deleteUserNotification(userId: number, notificationId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user: { id: userId } }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found or not authorized');
    }

    await this.notificationRepository.delete(notificationId);
  }

  async deleteAllUserNotifications(userId: number): Promise<void> {
    try {
      await this.notificationRepository.delete({ user: { id: userId } });
    } catch (error) {
      this.logger.error('Error deleting all notifications:', error);
      throw new Error('Failed to delete all notifications');
    }
  }

}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/notif.entity';
import { Order } from 'src/order.entity';
import { Comment } from 'src/comment.entity';
import { Folder } from 'src/folder.entity';
import { User } from 'src/user.entity';


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
    private readonly folderRepository: Repository<Folder>
  ) {}

  async createNotifForComment(message: string, commentId: number): Promise<Notification> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['user'] });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const notification = new Notification();
    notification.message = message;
    notification.comment = comment;
    notification.user = comment.user; // Notify the owner of the comment

    return this.notificationRepository.save(notification);
  }
  async createNotifForReply(message: string, commentId: number): Promise<Notification> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['user'] });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const notification = new Notification();
    notification.message = message;
    notification.comment = comment;
    notification.user = comment.user; // Notify the owner of the comment

    return this.notificationRepository.save(notification);
  }

async createNotifForMention(message: string, commentId: number): Promise<Notification> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['user'] });
    if (!comment) {
      throw new Error('Comment not found');
    }

    const notification = new Notification();
    notification.message = message;
    notification.comment = comment;
    notification.user = comment.user; // Notify the mentioned user

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
    notification.user = folderOwner; // Notify the owner of the folder

    return this.notificationRepository.save(notification);
  }

  async createNotifForOrder(message: string, orderId: number): Promise<Notification> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new Error('Order not found');
    }

    const notification = new Notification();
    notification.message = message;
    notification.order = order;
    notification.user = order.user; // Notify the owner of the order

    return this.notificationRepository.save(notification);
  }

  async getAllNotifications(userId: number): Promise<Notification[]> {
    try {
        return await this.notificationRepository.find({
            where: { user: { id: userId } }, // Filter by user ID
            relations: ['order', 'comment', 'comment.user', 'comment.folder', 'user'],
            order: { createdAt: 'DESC' },
        });
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        throw new Error('Unable to fetch notifications');
    }
}


async deleteUserNotification(userId: number, notificationId: number): Promise<void> {
  const notification = await this.notificationRepository.findOne({ 
      where: { id: notificationId, user: { id: userId } } // Ensure the notification belongs to the user
  });
  
  if (!notification) {
      throw new NotFoundException('Notification not found or not authorized');
  }

  await this.notificationRepository.delete(notificationId);
}

async deleteAllUserNotifications(userId: number): Promise<void> {
  try {
      await this.notificationRepository.delete({ user: { id: userId } }); // Delete all notifications for this user
  } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw new Error('Failed to delete all notifications');
  }
}



  // async deleteNotification(id:number): Promise<void>{
  //  await this.notificationRepository.delete(id)
  // }
 
  async deleteAllNotifications(): Promise<void> {
    try {
      await this.notificationRepository.delete({});
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw new Error('Failed to delete all notifications');
    }
  }
  
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from 'src/comment.entity';
import { Folder } from 'src/folder.entity';
import { User } from 'src/user.entity';
@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Folder)
    private folderRepository: Repository<Folder>,
  
  ) {}

  // backend service
  async addComment(
    folderId: number,
    userId: number,
    content: string,
  ): Promise<Comment> {
    try {
      // Find the logged-in user based on userId
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Fetch the folder based on folderId
      const folder = await this.folderRepository.findOne({
        where: { id: folderId },
      });
      if (!folder) {
        throw new Error('Folder not found');
      }

      // Create a new comment
      const newComment = new Comment();
      newComment.content = content;
      newComment.createdAt = new Date();
      newComment.user = user;
      newComment.folder = folder;

      // Save the new comment
      return await this.commentRepository.save(newComment);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  //fetch comments
  async getCommentsByFolderId(folderId: number): Promise<Comment[]> {
    return await this.commentRepository.find({
      where: { folder: { id: folderId } },
      relations: ['user'],
    });
  }

  // add reply to comment
  async addReplyToComment(
    commentId: number,
    userId: number,
    replyMessage: string,
    replyCreateDate: Date,
  ): Promise<Comment> {
    try {
      // Find the comment based on commentId
      const comment = await this.commentRepository.findOne({
        where: { id: commentId },
      });
      if (!comment) {
        throw new Error('Comment not found');
      }

      // Find the user based on userId
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Create a new reply object
      const newReply = {
        user: user,
        content: replyMessage,
        createdAt: replyCreateDate,
      };

      // Add the reply to the comment
      if (!comment.replies) {
        comment.replies = [];
      }
 //     comment.replies.push(newReply);

      // Save the updated comment
      return await this.commentRepository.save(comment);
    } catch (error) {
      console.error('Error adding reply to comment:', error);
      throw error;
    }
  }

  //   async addReplyToComment(commentId: number, userId: number, replyMessage: string, replyCreateDate: Date): Promise<Comment> {
  //     try {
  //         const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ["user"] });
  //         if (!comment) {
  //             throw new Error('Comment not found');
  //         }

  //         const user = await this.userRepository.findOne({ where: { id: userId } });
  //         if (!user) {
  //             throw new Error('User not found');
  //         }

  //         const taggedUsers = this.extractTaggedUsers(replyMessage); // Extract tagged users from the reply message

  //         // Create a new reply object
  //         const newReply = {
  //             user: user,
  //             content: replyMessage,
  //             createdAt: replyCreateDate
  //         };

  //         // Add the reply to the comment
  //         if (!comment.replies) {
  //             comment.replies = [];
  //         }
  //         comment.replies.push(newReply);

  //         // Save the updated comment
  //         await this.commentRepository.save(comment);

  //         // Send notifications to tagged users
  //         await this.sendNotificationsToTaggedUsers(taggedUsers, user, comment);

  //         return comment;
  //     } catch (error) {
  //         console.error('Error adding reply to comment:', error);
  //         throw error;
  //     }
  // }

  // private async sendNotificationsToTaggedUsers(taggedUsers: User[], sender: User, comment: Comment): Promise<void> {
  //     for (const taggedUser of taggedUsers) {
  //         const notification = new Notification();
  //         notification.content = `You have been mentioned in a comment by ${sender.username}`;
  //         notification.type = 'mention';
  //         notification.sender = sender;
  //         notification.receiver = taggedUser;
  //         await this.notificationRepository.save(notification);
  //     }
  // }

  // private extractTaggedUsers(replyMessage: string): User[] {
  //     // Logic to extract tagged users from the reply message
  //     // You can use regular expressions or any other method to identify tagged users
  //     // For example, if tagged users are prefixed with @username, you can extract them using regex
  //     // This is just a placeholder, you need to implement your own logic here
  //     return [];
  // }
}

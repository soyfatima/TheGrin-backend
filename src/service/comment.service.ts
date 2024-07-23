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

 
  async addComment(folderId: number, userId: number, content: string): Promise<Comment> {
    const user = await this.userRepository.findOne({where:{id:userId}});
    const folder = await this.folderRepository.findOne({where:{id:folderId}});

    if (!user || !folder) {
      throw new Error('User or Folder not found');
    }

    const comment = new Comment();
    comment.content = content;
    comment.user = user;
    comment.folder = folder;

    return this.commentRepository.save(comment);
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

 

  async addReply(commentId: number, content: string, userId: number): Promise<Comment> {
    const parentComment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }
    const reply = this.commentRepository.create({ 
      content, 
      user: { id: userId }, 
      parent: parentComment,
      folder: parentComment.folder  // Ensure the folder is also set correctly
    });
    return this.commentRepository.save(reply);
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

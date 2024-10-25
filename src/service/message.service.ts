import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user.entity';
import { Message } from 'src/message.entity';
import { MessagingGateway } from 'src/messaging.gateway';
import { CustomLogger } from 'src/logger/logger.service';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Message) private messagesRepository: Repository<Message>,
    private messagingGateway: MessagingGateway,
    private readonly logger: CustomLogger,

  ) { }

  async sendMessage(UserId: number, recipientId: number, content: string): Promise<Message> {
    const sender = await this.userRepository.findOne({ where: { id: UserId } });
    const recipient = await this.userRepository.findOne({ where: { id: recipientId } });

    if (!sender || !recipient) {
      throw new NotFoundException('User not found');
    }

    if (sender.message_limit <= 0) {
      throw new ForbiddenException('Message limit reached');
    }

    // Create and save the message
    const message = this.messagesRepository.create({ sender, recipient, content });
    await this.messagesRepository.save(message);

    // Decrement sender's message limit
    sender.message_limit--;
    await this.userRepository.save(sender);

    // Notify the recipient
    this.messagingGateway.notifyUser(recipientId, message);

    return message;
  }


  async getMessages(userId: number, recipientId: number): Promise<Message[]> {
    const messages = await this.messagesRepository.find({
      where: [
        { sender: { id: userId }, recipient: { id: recipientId } },
        { sender: { id: recipientId }, recipient: { id: userId } },
      ],
      relations: ['sender', 'recipient'],
      order: { createdAt: 'ASC' },
    });

    return messages.map(message => ({
      ...message,
      isSender: message.sender.id === userId,
      isRecipient: message.recipient.id === userId,
    }));
  }


  async getSenders(userId: number): Promise<{ user: User; unreadCount: number; lastMessageContent: string }[]> {
    const messages = await this.messagesRepository.find({
      where: { recipient: { id: userId }, read: false },
      relations: ['sender'], // Fetch the sender relation
    });

    const senderMap = new Map<number, { unreadCount: number; lastMessageContent: string }>();
    messages.forEach(msg => {
      const senderId = msg.sender.id;
      const currentCount = senderMap.get(senderId) || { unreadCount: 0, lastMessageContent: '' };

      currentCount.unreadCount += 1;
      currentCount.lastMessageContent = msg.content;

      senderMap.set(senderId, currentCount);
    });

    const sendersWithUnreadCount = await Promise.all(
      Array.from(senderMap.entries()).map(async ([senderId, { unreadCount, lastMessageContent }]) => {
        const sender = await this.userRepository.findOne({ where: { id: senderId } });
        return { user: sender, unreadCount, lastMessageContent };
      })
    );

    return sendersWithUnreadCount;
  }



  // async markMessagesAsRead(userId: number): Promise<void> {
  //   await this.messagesRepository.update(
  //     { recipient: { id: userId }, read: false },
  //     { read: true },
  //   );
  // }

  async markMessagesAsRead(userId: number, recipientId: number): Promise<void> {
    await this.messagesRepository.update(
      { recipient: { id: recipientId }, sender: { id: userId }, read: false },
      { read: true }
    );
  }


}

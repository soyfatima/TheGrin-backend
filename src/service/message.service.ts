import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user.entity';
import { Message } from 'src/message.entity';
import { MessagingGateway } from 'src/messaging.gateway';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(User)
        private userRepository: Repository<User>,
    @InjectRepository(Message) private messagesRepository: Repository<Message>,
    private messagingGateway: MessagingGateway, 
) {}
  
// async sendMessage(UserId: number, recipientId: number, content: string): Promise<Message> {
//     const sender = await this.userRepository.findOne({ where: { id: UserId } });
//     const recipient = await this.userRepository.findOne({ where: { id: recipientId } });

//     if (!sender || !recipient) {
//         throw new NotFoundException('User not found');
//     }

//     if (sender.message_limit <= 0) {
//         throw new ForbiddenException('Message limit reached');
//     }

//     // Create and save the message
//     const message = this.messagesRepository.create({ sender, recipient, content });
//     await this.messagesRepository.save(message);

//     // Decrement sender's message limit
//     sender.message_limit--;
//     await this.userRepository.save(sender);

//     // Notify the recipient
//     this.messagingGateway.notifyUser(recipientId, message);


//     return message;
// }


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
  console.log('Messages retrieved from database:', messages);

  return messages.map(message => ({
    ...message,
    isSender: message.sender.id === userId,
    isRecipient: message.recipient.id === userId,
  }));
}


  // async getSenders(userId: number): Promise<User[]> {
  //   const messages = await this.messagesRepository.find({
  //     where: { recipient: { id: userId } },
  //     relations: ['sender'],
  //   });
  
  //   // Extract unique sender IDs
  //   const senderIds = [...new Set(messages.map(msg => msg.sender.id))];
  //   const senders = await this.userRepository.findByIds(senderIds);
  
  //   return senders;
  // }
  

  async getSenders(userId: number): Promise<{ user: User; unreadCount: number }[]> {
    const messages = await this.messagesRepository.find({
        where: { recipient: { id: userId }, read: false },
        relations: ['sender'],
    });

    // Extract unique sender IDs and count unread messages
    const senderMap = new Map<number, number>();
    messages.forEach(msg => {
        const senderId = msg.sender.id;
        senderMap.set(senderId, (senderMap.get(senderId) || 0) + 1);
    });

    // Retrieve users with their unread message counts
    const sendersWithUnreadCount = await Promise.all(
        Array.from(senderMap.entries()).map(async ([senderId, unreadCount]) => {
            const sender = await this.userRepository.findOne({where :{id:senderId}});
            return { user: sender, unreadCount };
        })
    );

    return sendersWithUnreadCount;
}



  async markMessagesAsRead(userId: number): Promise<void> {
    await this.messagesRepository.update(
      { recipient: { id: userId }, read: false },
      { read: true },
    );
  }

}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingGateway } from './messaging.gateway';
import { Message } from './message.entity';
import { User } from './user.entity';
import { MessagingService } from './service/message.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Message]),
  ],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule { }

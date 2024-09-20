import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    CreateDateColumn,
  } from 'typeorm';
  import { User } from './user.entity';
  
  @Entity({ name: 'messages' })
  export class Message {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => User, (user) => user.sentMessages)
    sender: User;
  
    @ManyToOne(() => User, (user) => user.receivedMessages)
    recipient: User;
  
    @Column()
    content: string;
  
    @Column({ default: false })
    read: boolean;
  
    @CreateDateColumn()
    createdAt: Date;

    
  }
  
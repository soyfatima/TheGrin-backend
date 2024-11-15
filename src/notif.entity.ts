import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { Comment } from './comment.entity';
import { User } from './user.entity';
import { Folder } from './folder.entity';
import { AdminNotes } from './adminNote.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'CASCADE' })
  order: Order;
  
  @Column({ type: 'boolean', default: false })
  read: boolean;
  
  @ManyToOne(() => Comment, comment => comment.notifications, { onDelete: 'CASCADE' })
  comment: Comment;

  @ManyToOne(() => Folder, { onDelete: 'CASCADE', nullable: true }) 
  folder: Folder;

  @ManyToOne(() => AdminNotes, { onDelete: 'CASCADE', nullable: true }) 
  note: AdminNotes;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { Comment } from './comment.entity';
import { User } from './user.entity';
import { Folder } from './folder.entity';
@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Order, { nullable: true })
  order: Order;

 
  @ManyToOne(() => Comment, comment => comment.notifications, { onDelete: 'CASCADE' })
  comment: Comment;

  @ManyToOne(() => Folder, { nullable: true }) // Define Folder relation if used
  folder: Folder;

  @ManyToOne(() => User, { nullable: true })
  user: User;
}

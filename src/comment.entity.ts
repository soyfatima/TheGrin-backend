import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,

} from 'typeorm';
import { User } from './user.entity';
import { Folder } from './folder.entity';
import { Notification } from './notif.entity';
import { Admin } from './admin.entity';
import { Report } from './report.entity';

@Entity({ name: 'comments' })
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Admin, (admin) => admin.comments, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  admin: Admin;

  @ManyToOne(() => Folder, (folder) => folder.comments, { onDelete: 'CASCADE' })
  @JoinColumn()
  folder: Folder;

  @ManyToOne(() => Comment, (comment) => comment.replies, { onDelete: 'CASCADE' })
  @JoinColumn()
  parent: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent, { cascade: true })
  replies: Comment[];

  @OneToMany(() => Notification, (notification) => notification.comment, { cascade: true })
  notifications: Notification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Report, (report) => report.comment, { cascade: ['remove'], onDelete: 'CASCADE' })
  reports: Report[];

}

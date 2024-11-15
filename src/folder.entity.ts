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
import { Comment } from './comment.entity';
import { Admin } from './admin.entity';
import { UserNoteReadStatus } from './noteread.entity';
import { Report } from './report.entity';
import { Notification } from './notif.entity';

@Entity({ name: 'folders' })
export class Folder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  category: string;

  @Column()
  content: string;

  @Column({ nullable: true })
  uploadedFile: string;

  @ManyToOne(() => User, (user) => user.folders, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @OneToMany(() => Comment, (comment) => comment.folder, { cascade: true })
  comments: Comment[];

  // @OneToMany(() => UserNoteReadStatus, (noteReadStatus) => noteReadStatus.folder, { cascade: true, eager: true })
  // noteReadStatus: UserNoteReadStatus[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Report, (report) => report.folder, { cascade: ['remove'], onDelete: 'CASCADE' })
  reports: Report[];
  static title: any;

  @OneToMany(() => Notification, (notification) => notification.folder, { cascade: true })
  notifications: Notification[];


}

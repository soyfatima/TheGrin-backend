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

  @ManyToOne(() => Admin, (admin) => admin.folders, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  admin: Admin;

  @Column({ default: false })  
  isAdmin: boolean;
  
  @OneToMany(() => Comment, (comment) => comment.folder, { cascade: true })
  comments: Comment[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

}

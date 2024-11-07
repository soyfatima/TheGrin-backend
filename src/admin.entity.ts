import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Folder } from './folder.entity';
import * as bcrypt from 'bcrypt';
import { Comment } from './comment.entity';

@Entity({ name: 'admins' })
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;
  
  @Column()
  email: string;

  @Column()
  password: string;


  @OneToMany(() => Folder, (folder) => folder.admin, { onDelete: 'CASCADE' })
  folders: Folder[];

  
  @OneToMany(() => Comment, (comment) => comment.admin)
  comments: Comment[];

   bcrypt = require('bcrypt');
  hashedPassword = bcrypt.hashSync('admin00', 10);
  
  
}

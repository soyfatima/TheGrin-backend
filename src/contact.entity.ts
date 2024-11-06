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
  //import { User } from './user.entity';
  import { Comment } from './comment.entity';
  import { Admin } from './admin.entity';
  import { UserNoteReadStatus } from './noteread.entity';
  import { Report } from './report.entity';
  
  @Entity({ name: 'contact' })
  export class Contact {

    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    object: string;
  
    @Column()
    username:string; 

    @Column()
    email: string;

    @Column()
    content: string;
  
    // @ManyToOne(() => User, (user) => user.folders, { onDelete: 'CASCADE' })
    // @JoinColumn()
    // user: User;

  }
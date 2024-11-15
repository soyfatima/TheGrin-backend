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

@Entity({ name: 'notes' })
export class AdminNotes {
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

    @ManyToOne(() => Admin, (admin) => admin.note, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn()
    admin: Admin;

    @OneToMany(() => UserNoteReadStatus, (noteReadStatus) => noteReadStatus.note, { cascade: true, eager: true })
    noteReadStatus: UserNoteReadStatus[];

    @OneToMany(() => Notification, (notification) => notification.note, { cascade: true })
    notifications: Notification[];

}
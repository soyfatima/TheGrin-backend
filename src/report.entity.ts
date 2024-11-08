import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Comment } from './comment.entity'; 
import { User } from './user.entity';
import { Folder } from './folder.entity';

@Entity()
export class Report {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.reportsMade)
    @JoinColumn({ name: 'reporterId' })
    reporter: User;

    // The user being reported
    @ManyToOne(() => User, (user) => user.reportsReceived)
    @JoinColumn({ name: 'userId' })
    user: User;
    
    // @ManyToOne(() => Comment, (comment) => comment.reports, { onDelete: 'CASCADE' })
    // comment: Comment;

    //@ManyToOne(() => Comment, (comment) => comment.reports)
    // reply: Comment; 
    
    @ManyToOne(() => Comment, (comment) => comment.reports, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'commentId' })
    comment: Comment;
    
    @ManyToOne(() => Comment, (comment) => comment.reports, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'replyId' })
    reply: Comment;
    
    @ManyToOne(() => Folder, (folder) => folder.reports)
    folder: Folder;

    @Column()
    reason: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}

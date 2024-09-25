import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Comment } from './comment.entity'; 
import { User } from './user.entity';
import { Folder } from './folder.entity';

@Entity()
export class Report {
    @PrimaryGeneratedColumn()
    id: number;

    // @ManyToOne(() => User, (user) => user.reports) // Establishing the relationship to User
    // user: User;


    // The reporter (the user making the report)
    @ManyToOne(() => User, (user) => user.reportsMade)
    @JoinColumn({ name: 'reporterId' })
    reporter: User;

    // The user being reported
    @ManyToOne(() => User, (user) => user.reportsReceived)
    @JoinColumn({ name: 'userId' })
    user: User;
    
    @ManyToOne(() => Comment, (comment) => comment.reports)
    comment: Comment;

    @ManyToOne(() => Folder, (folder) => folder.reports)
    folder: Folder;

    @Column()
    reason: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}

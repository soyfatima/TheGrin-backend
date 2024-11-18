import { Admin, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { Folder } from "./folder.entity";
import { AdminNotes } from "./adminNote.entity";

@Entity()
export class UserNoteReadStatus {
    @PrimaryGeneratedColumn()
    id: number;

    // @ManyToOne(() => Folder, (folder) => folder.noteReadStatus, { onDelete: 'CASCADE' })
    // @JoinColumn()
    // folder: Folder;

    @ManyToOne(() => User, (user) => user.noteReadStatus, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    @ManyToOne(() => AdminNotes, (note) => note.noteReadStatus, { onDelete: 'CASCADE' })
    @JoinColumn()
    note: AdminNotes;

    @Column({ default: false })
    read: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

}


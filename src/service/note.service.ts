import {
    ConflictException,
    ForbiddenException,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder } from 'src/folder.entity';
import { createReadStream, createWriteStream } from 'fs';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import * as fs from 'fs';
import { User } from 'src/user.entity';
import {
    Comment

} from 'src/comment.entity';
import { Admin } from 'src/admin.entity';
import { UserNoteReadStatus } from 'src/noteread.entity';
import { CustomLogger } from 'src/logger/logger.service';
import { AdminNotes } from 'src/adminNote.entity';
@Injectable()
export class NoteService {
    constructor(
        @InjectRepository(Folder)
        private folderRepository: Repository<Folder>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Admin)
        private adminRepository: Repository<Admin>,
        @InjectRepository(UserNoteReadStatus)
        private userNoteReadStatusRepository: Repository<UserNoteReadStatus>,
        @InjectRepository(Comment)
        private commentRepository: Repository<Comment>,
        @InjectRepository(AdminNotes)
        private noteRepository: Repository<AdminNotes>,
        private readonly logger: CustomLogger,

    ) { }


    async createAdminNote(noteData: Partial<AdminNotes>): Promise<AdminNotes> {
        const note = this.folderRepository.create({
            ...noteData,
            //  isAdmin: true,
            //   admin: admin,
        });

        const savedNote = await this.noteRepository.save(note);
        const allUsers = await this.userRepository.find();

        if (allUsers && allUsers.length > 0) {
            const noteReadStatuses = allUsers.map(user => ({
                folder: savedNote,
                user: user,
                read: false,
            }));
            await this.userNoteReadStatusRepository.save(noteReadStatuses);
        } else {
            this.logger.warn('Aucun utilisateur trouvé pour initialiser le statut de lecture');
        }

        return savedNote;
    } 

    async getAllAdminNote(): Promise<AdminNotes[]> {
        return await this.noteRepository.find({
            //  where: { isAdmin: true },
            relations: ['noteReadStatus', 'noteReadStatus.user'],
        });
    }

    //update adminnote
    async updateAdminNote(
        id: number,
        updatedNoteData: Partial<AdminNotes>,
    ): Promise<AdminNotes> {
        const note = await this.noteRepository.findOne({
            where: { id },
        });

        if (!note) {
            throw new NotFoundException('Admin folder not found');
        }

        Object.assign(note, updatedNoteData);
        return await this.noteRepository.save(note);
    }

    //delete admin note
    async deleteAdminNote(id: number): Promise<void> {
        const result = await this.noteRepository.delete({
            id,
            //  isAdmin: true,
        });

        if (result.affected === 0) {
            throw new NotFoundException('Admin folder not found');
        }
    }

    async getAdminNoteDetailById(id: number): Promise<AdminNotes> {
        const note = await this.noteRepository.findOne({
            where: { id },
        });

        if (!note) {
            throw new NotFoundException('Admin folder not found');
        }

        return note;
    }

    async markNoteAsRead(noteId: number, userId: number): Promise<void> {
        let noteReadStatus = await this.userNoteReadStatusRepository.findOne({
            where: {
                note: { id: noteId },
                user: { id: userId },
            },
        });
    
        if (!noteReadStatus) {
            // Create a new entry if one does not exist
            noteReadStatus = new UserNoteReadStatus();
            noteReadStatus.note = { id: noteId } as AdminNotes;  // Assuming AdminNotes is your note entity
            noteReadStatus.user = { id: userId } as User;
            noteReadStatus.read = true; // Mark the note as read
            await this.userNoteReadStatusRepository.save(noteReadStatus);
        } else {
            noteReadStatus.read = true;
            await this.userNoteReadStatusRepository.save(noteReadStatus);
        }
    }
       
}
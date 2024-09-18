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
@Injectable()
export class FolderService {
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
  ) { }

  //create folder
  async createFolder(userId: number, folderData: Partial<Folder>): Promise<Folder> {
    const folder = this.folderRepository.create({
      ...folderData,
      user: { id: userId }
    });

    return await this.folderRepository.save(folder);
  }


  async getUserFolders(id: number, userId: number): Promise<any[]> {
    const folders = await this.folderRepository.find({
      where: { user: { id: id } },
      relations: ['user']
    });
    return Promise.all(folders.map(async (folder) => {
      const commentCount = await this.commentRepository
        .createQueryBuilder('comment')
        .where('comment.folderId = :folderId', { folderId: folder.id })
        .getCount();

      return {
        ...folder,
        commentCount,
      };
    }));
  }


  // fetch folders and folderdetails
  async getAllFolders(): Promise<Folder[]> {
    return await this.folderRepository.find({ relations: ['user'], });
  }


  //edit content
  async updateFolderContent(userId: number, id: number, content: string): Promise<Folder> {
    // Fetch the folder including its associated user
    const folder = await this.folderRepository.findOne({
      where: { id: id },
      relations: ['user'],
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    if (folder.user.id !== userId) {
      throw new ForbiddenException('You are not allowed to edit this folder');
    }

    folder.content = content;
    await this.folderRepository.save(folder);
    return folder;
  }


  //get all folder number of comment


  async deleteFolder(id: number, folderId: number): Promise<void> {
    // Ensure the folder belongs to the user
    const folder = await this.folderRepository.findOne({
      where: { id: folderId, user: { id: id } },
    });

    if (!folder) {
      throw new Error('Folder not found or you do not have permission to delete this folder');
    }

    await this.folderRepository.remove(folder); // Use remove to ensure proper entity deletion
  }

  //get folderdetails by ID
  async getFolderDetailsById(id: number): Promise<Folder> {
    return await this.folderRepository.findOne({ where: { id } });
  }


  /////////////////////
  /////////admin note

  async createAdminNote(folderData: Partial<Folder>, admin: Admin): Promise<Folder> {
    const folder = this.folderRepository.create({
      ...folderData,
      isAdmin: true,
      admin: admin,
    });

    const savedFolder = await this.folderRepository.save(folder);

    const allUsers = await this.userRepository.find();

    if (allUsers && allUsers.length > 0) {
      const noteReadStatuses = allUsers.map(user => ({
        folder: savedFolder,
        user: user,
        read: false,
      }));

      await this.userNoteReadStatusRepository.save(noteReadStatuses);
    } else {
      console.warn('Aucun utilisateur trouvé pour initialiser le statut de lecture');
    }

    return savedFolder;
  }

  async getAllAdminNote(): Promise<Folder[]> {
    return await this.folderRepository.find({
      where: { isAdmin: true },
      relations: ['noteReadStatus', 'noteReadStatus.user'],
    });
  }

  //update adminnote
  async updateAdminNote(
    id: number,
    updatedFolderData: Partial<Folder>,
  ): Promise<Folder> {
    const folder = await this.folderRepository.findOne({
      where: { id, isAdmin: true },
    });

    if (!folder) {
      throw new NotFoundException('Admin folder not found');
    }

    Object.assign(folder, updatedFolderData);
    return await this.folderRepository.save(folder);
  }

  //delete admin note
  async deleteAdminNote(id: number): Promise<void> {
    const result = await this.folderRepository.delete({
      id,
      isAdmin: true,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Admin folder not found');
    }
  }

  async getAdminNoteDetailById(id: number): Promise<Folder> {
    const folder = await this.folderRepository.findOne({
      where: { id, isAdmin: true },
    });

    if (!folder) {
      throw new NotFoundException('Admin folder not found');
    }

    return folder;
  }

  async markNoteAsRead(noteId: number, userId: number): Promise<void> {
    const noteReadStatus = await this.userNoteReadStatusRepository.findOne({
      where: {
        folder: { id: noteId },
        user: { id: userId },
      },
    });

    if (noteReadStatus) {
      noteReadStatus.read = true;
      await this.userNoteReadStatusRepository.save(noteReadStatus);
    } else {
    //  console.warn('Aucun statut de lecture trouvé pour la noteId:', noteId, 'userId:', userId);
      throw new HttpException('Statut de lecture non trouvé', HttpStatus.NOT_FOUND);
    }
  }

}
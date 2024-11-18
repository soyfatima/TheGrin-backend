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
    @InjectRepository(AdminNotes)
    private noteRepository: Repository<AdminNotes>,
    private readonly logger: CustomLogger,

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
  async updateFolderContent(userId: number, id: number, title: string, content: string): Promise<Folder> {
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

    folder.title = title;
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

    await this.folderRepository.remove(folder);
  }

  //get folderdetails by ID
  async getFolderDetailsById(id: number): Promise<Folder> {
    return await this.folderRepository.findOne({ where: { id } });
  }


  /////////////////////
  /////////admin note

 
  async deleteUserFolder(adminId: number, folderId: number): Promise<Folder> {
    const folder = await this.folderRepository.findOne({ where: { id: folderId }, relations: ['user'] });
    if (!folder) {
      throw new NotFoundException('User folder not found or has already been deleted.');
    }

    const isAdmin = await this.checkIfAdmin(adminId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can delete this folder.');
    }

    await this.folderRepository.delete(folderId);

    return folder;
  }

  async checkIfAdmin(adminId: number): Promise<boolean> {
    const admin = await this.adminRepository.findOne({ where: { id: adminId } });
    return !!admin;
  }

}
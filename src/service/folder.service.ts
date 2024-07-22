import {
  ConflictException,
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
import { Admin } from 'src/admin.entity';

@Injectable()
export class FolderService {
  constructor(
    @InjectRepository(Folder)
    private folderRepository: Repository<Folder>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  //create folder
  async createFolder(folderData: Partial<Folder>): Promise<Folder> {
    const folder = this.folderRepository.create(folderData);
    return await this.folderRepository.save(folder);
  }

  // fetch folders and folderdetails
  async getAllFolders(): Promise<Folder[]> {
    return await this.folderRepository.find();
  }

  //update folderdetails
  async updateFolder(
    id: number,
    updatedFolderData: Partial<Folder>,
  ): Promise<Folder> {
    const folder = await this.folderRepository.findOne({ where: { id } });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
    Object.assign(folder, updatedFolderData);
    return await this.folderRepository.save(folder);
  }

  //delete folder
  async deleteFolder(id: number): Promise<void> {
    await this.folderRepository.delete(id);
  }

  //get folderdetails by ID
  async getFolderDetailsById(id: number): Promise<Folder> {
    return await this.folderRepository.findOne({ where: { id } });
  }
}

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
import { User } from 'src/user.entity';

@Injectable()
export class FolderService {
  constructor(
    @InjectRepository(Folder)
    private folderRepository: Repository<Folder>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  //create folder
  async createFolder(userId: number, folderData: Partial<Folder>): Promise<Folder> {
    const folder = this.folderRepository.create({
      ...folderData,
      user: { id: userId } // Ensure you link the folder to the user
    });

    return await this.folderRepository.save(folder);
  }


  // fetch folders and folderdetails
  async getFoldersByUser(userId:number): Promise<Folder[]> {
    return await this.folderRepository.find({where :{user: {id:userId}}});
  }

    // fetch folders and folderdetails
    async getAllFolders(): Promise<Folder[]> {
      return await this.folderRepository.find({ relations: ['user'] });
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

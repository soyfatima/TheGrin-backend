import {
  ConflictException,
  ForbiddenException,
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
      user: { id: userId } 
      
    });

    return await this.folderRepository.save(folder);
  }


  // fetch folders and folderdetails
  // async getFoldersByUser(userId:number): Promise<Folder[]> {
  //   return await this.folderRepository.find({where :{user: {id:userId}}});
  // }


    // fetch folders and folderdetails
    async getAllFolders(): Promise<Folder[]> {
      return await this.folderRepository.find({ relations: ['user'] });
    }
  


    async updateFolderContent(userId: number, id: number, content: string): Promise<Folder> {
      // Fetch the folder including its associated user
      const folder = await this.folderRepository.findOne({
        where: { id: id },
        relations: ['user'],
      });
      
      // Handle case where folder is not found
      if (!folder) {
        throw new NotFoundException('Folder not found');
      }
      
      // Check if the user making the request is the owner of the folder
      if (folder.user.id !== userId) {
        throw new ForbiddenException('You are not allowed to edit this folder');
      }
      
      // Update the folder content
      folder.content = content;
      await this.folderRepository.save(folder);
      return folder;
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

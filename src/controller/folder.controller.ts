import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Res,
  NotFoundException,
  ConflictException,
  Query,
  HttpException,
  HttpStatus,
  Put,
  Delete,
  Request,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Express } from 'express';
import { Folder } from '../folder.entity';
import { FolderService } from '../service/folder.service';
import { multerOptions } from '../multerOptions';
import { JwtAuthGuard } from 'src/jwtGuard/jwt-auth.guard';
import { folderFileOptions } from 'src/fileOption';
import { adminFileOptions } from 'src/adminFileOption';
import { CustomLogger } from 'src/logger/logger.service';
import { BannedGuard } from 'src/jwtGuard/banned.guard';
import { AdminNotes } from 'src/adminNote.entity';

@Controller('folders')
export class FolderController {
  constructor(private FolderService: FolderService,
    private readonly logger: CustomLogger,

  ) { }

  //create folder 
  @Post('create')
  @UseGuards(JwtAuthGuard, BannedGuard)
  @UseInterceptors(FileInterceptor('uploadedFile', folderFileOptions))
  async createFolder(
    @UploadedFile() file,
    @Req() req,
    @Body() folderData: Partial<Folder>,
  ) {
    try {
      const userId = (req.user as { userId: number }).userId;
      if (!folderData.content) {
        throw new Error('Content is required');
      }
      const updatedFolderData = {
        ...folderData,
        uploadedFile: file ? file.filename : null, 
      };

      const folder = await this.FolderService.createFolder(userId, updatedFolderData);
      return folder;
    } catch (error) {
      this.logger.error('Error during folder creation:', error.message);
      throw new HttpException(
        'Failed to create folder',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  //fetch folder and folderdetails
  @Get('user-folders/:id')
  async getUserFolders(
    @Param('id') id: number,
    @Param('userId') userId: number): Promise<Folder[]> {
    return await this.FolderService.getUserFolders(id, userId);
  }


  //fetch folder and folderdetails
  @Get('folderdetails')
  async getAllFolders(): Promise<Folder[]> {
    return await this.FolderService.getAllFolders();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateFolderContent(
    @Req() req: any,
    @Param('id') id: number,
    @Body('title') title:string,
    @Body('content') content: string,
  ) {
    const userId = (req.user as { userId: number }).userId;
    return this.FolderService.updateFolderContent(userId, id, title, content);
  }

  //delete folder
  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  async deleteFolder(
    @Param('id') id: number,
    @Req() req,
  ) {
    try {
      const userId = (req.user as { userId: number }).userId;
      await this.FolderService.deleteFolder(userId, id);
      return { message: 'Folder deleted successfully' };
    } catch (error) {
      this.logger.error('Error during folder deletion:', error.message);
      throw new HttpException(
        'Failed to delete folder',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  //get folderdetails by id
  @Get('getfolderdetails/:id')
  async getFolderDetailsById(@Param('id') id: number): Promise<Folder> {
    return await this.FolderService.getFolderDetailsById(id);
  }


  @Delete(':folderId')
  @UseGuards(JwtAuthGuard)
  async deleteUserFolder(
    @Param('folderId') folderId: number,
    @Req() req,
  ): Promise<Folder> {
    const adminId = (req.user as { userId: number }).userId;
    return this.FolderService.deleteUserFolder(adminId, folderId);
  }
  
}

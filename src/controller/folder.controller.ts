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

@Controller('folders')
export class FolderController {
  constructor(private FolderService: FolderService,
    private readonly logger: CustomLogger,

  ) { }

  //create folder 
  @UseGuards(JwtAuthGuard)
  @Post('create')
  @UseInterceptors(FileInterceptor('uploadedFile', folderFileOptions))
  async createFolder(
    @UploadedFile() file,
    @Req() req,
    @Body() folderData: Partial<Folder>,
  ) {
    try {
      const userId = (req.user as { userId: number }).userId;

      // Ensure content is present
      if (!folderData.content) {
        throw new Error('Content is required');
      }

      // Add the file information to folderData
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
  //@UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Put(':id')
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

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
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


  @UseGuards(JwtAuthGuard)
  @Post('create/note')
  @UseInterceptors(FileInterceptor('uploadedFile', adminFileOptions))
  async createAdminNote(
    @UploadedFile() file: Express.Multer.File,
    @Body() folderData: Partial<Folder>,
    @Req() req: any, 
  ) {
    try {
      const admin = req.user;  

      const folder = await this.FolderService.createAdminNote(
        {
          ...folderData,
          uploadedFile: file ? file.filename : null, 
        },
        admin, 
      );
      return folder;
    } catch (error) {
      this.logger.error('Erreur lors de la création du dossier:', error);
      throw new HttpException(
        'Impossible de créer le dossier',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //get admin note
  @Get('admin-notes')
  async getAllAdminNotes(): Promise<Folder[]> {
    return await this.FolderService.getAllAdminNote();
  }

  //update admin note
  @UseGuards(JwtAuthGuard)
  @Patch('update/note/:id')
  async updateAdminNote(
    @Param('id') id: number,
    @Body() updatedFolderData: Partial<Folder>,
  ): Promise<Folder> {
    try {
      const folder = await this.FolderService.updateAdminNote(id, updatedFolderData);
      return folder;
    } catch (error) {
      throw new HttpException(
        'Failed to update folder',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/note/:id')
  async deleteAdminNote(
    @Param('id') id: number,
  ): Promise<void> {
    try {
      await this.FolderService.deleteAdminNote(id);
    } catch (error) {
      throw new HttpException(
        'Failed to delete folder',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //@UseGuards(JwtAuthGuard)
  @Get('notedetails/:id')
  async getAdminNoteDetailById(
    @Param('id') id: number,
  ): Promise<Folder> {
    try {
      const folder = await this.FolderService.getAdminNoteDetailById(id);
      return folder;
    } catch (error) {
      throw new HttpException(
        'Folder not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('mark-note-as-read')
  async markNoteAsRead(
    @Body('noteId') noteId: number,
    @Body('userId') userId: number,
    @Req() req,
  ): Promise<void> {
    userId = (req.user as { userId: number }).userId
    await this.FolderService.markNoteAsRead(noteId, userId);
  }
  @UseGuards(JwtAuthGuard)
  @Delete(':folderId')
  async deleteUserFolder(
    @Param('folderId') folderId: number,
    @Req() req,
  ): Promise<Folder> {
    const adminId = (req.user as { userId: number }).userId;
    return this.FolderService.deleteUserFolder(adminId, folderId);
  }
  
}

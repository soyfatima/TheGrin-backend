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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
//import { JwtAuthGuard } from '../jwtGuard/jwt-auth.guard';
import { Response } from 'express';
import { Express } from 'express';
import { Folder } from '../folder.entity';
import { FolderService } from '../service/folder.service';
import { multerOptions } from '../multerOptions';
import { JwtAuthGuard } from 'src/jwtGuard/jwt-auth.guard';

@Controller('folders')
export class FolderController {
  constructor(private FolderService: FolderService) { }

  //create folder 
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createFolder(
    @Req() req,
    @Body() folderData: Partial<Folder>,
  ) {
    try {
      const userId = (req.user as { userId: number }).userId;
      if (!folderData.content) {
        throw new Error('Content is required');
      }

      const folder = await this.FolderService.createFolder(userId, folderData);
      return folder;
    } catch (error) {
      console.error('Error during folder creation:', error.message); // Log error message
      throw new HttpException(
        'Failed to create folder',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //fetch folder and folderdetails
  // @UseGuards(JwtAuthGuard)
  // @Get('user-folders')
  // async getUserFolders(@Req() req): Promise<Folder[]> {
  //   try {
  //     const userId = (req.user as { userId: number }).userId;
  //     return await this.FolderService.getFoldersByUser(userId);
  //   } catch (error) {
  //     throw new HttpException(
  //       'Failed to fetch folders',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

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
    @Body('content') content: string,
  ) {
    const userId = (req.user as { userId: number }).userId;
    return this.FolderService.updateFolderContent(userId, id, content);
  }






  //delete folder

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteFolder(@Param('id') id: number): Promise<void> {
    await this.FolderService.deleteFolder(id);
  }

  //get folderdetails by id
  @Get('getfolderdetails/:id')
  async getFolderDetailsById(@Param('id') id: number): Promise<Folder> {
    return await this.FolderService.getFolderDetailsById(id);
  }
}

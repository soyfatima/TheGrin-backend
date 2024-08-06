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
import { folderFileOptions } from 'src/fileOption';

@Controller('folders')
export class FolderController {
  constructor(private FolderService: FolderService) { }

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
      uploadedFile: file ? file.filename : null, // Safely handle file
    };

    const folder = await this.FolderService.createFolder(userId, updatedFolderData);
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
  //@UseGuards(JwtAuthGuard)
  @Get('user-folders/:id')
  async getUserFolders(
    @Param('id')id:number,
    @Param('userId')userId:number): Promise<Folder[]> {
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
    @Body('content') content: string,
  ) {
    const userId = (req.user as { userId: number }).userId;
    return this.FolderService.updateFolderContent(userId, id, content);
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
      console.error('Error during folder deletion:', error.message);
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
}

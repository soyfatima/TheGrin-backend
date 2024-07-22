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
  constructor(private FolderService: FolderService) {}

  //create folder

  @UseGuards(JwtAuthGuard)
  @Post('create')
  //@UseInterceptors(FileInterceptor('uploadedFile'))
  async createFolder(
  //  @UploadedFile() file,
    @Body() folderData: Partial<Folder>,
  ) {
    try {
      const folder = await this.FolderService.createFolder({
        ...folderData,
     //   uploadedFile: file.filename,
      });
      return folder;
    } catch (error) {
      throw new HttpException(
        'Failed to create folder',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //fetch folder and folderdetails

  @Get('folderdetails')
  async getAllFolders(): Promise<Folder[]> {
    return await this.FolderService.getAllFolders();
  }

  //update folderdetails

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateFolder(
    @Param('id') id: number,
    @Body() updatedFolderData: Partial<Folder>,
  ): Promise<Folder> {
    return await this.FolderService.updateFolder(id, updatedFolderData);
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

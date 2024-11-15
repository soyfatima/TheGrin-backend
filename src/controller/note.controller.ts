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
  import { NoteService } from 'src/service/note.service';
  import { multerOptions } from '../multerOptions';
  import { JwtAuthGuard } from 'src/jwtGuard/jwt-auth.guard';
  import { folderFileOptions } from 'src/fileOption';
  import { adminFileOptions } from 'src/adminFileOption';
  import { CustomLogger } from 'src/logger/logger.service';
  import { BannedGuard } from 'src/jwtGuard/banned.guard';
  import { AdminNotes } from 'src/adminNote.entity';
  
  @Controller('note')
  export class NoteController {
    constructor(private NoteService: NoteService,
      private readonly logger: CustomLogger,
  
    ) { }

    
    @Post('create/note')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('uploadedFile', adminFileOptions))
    async createAdminNote(
      @UploadedFile() file: Express.Multer.File,
      @Body() noteData: Partial<AdminNotes>,
      @Req() req: any, 
    ) {
      try {
       // const admin = req.user;  
  
        const note = await this.NoteService.createAdminNote(
          {
            ...noteData,
            uploadedFile: file ? file.filename : null, 
          },
         // admin, 
        );
        return note;
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
  async getAllAdminNotes(): Promise<AdminNotes[]> {
    return await this.NoteService.getAllAdminNote();
  }

  //update admin note
  @Patch('update/note/:id')
  @UseGuards(JwtAuthGuard)
  async updateAdminNote(
    @Param('id') id: number,
    @Body() updatedNoteData: Partial<AdminNotes>,
  ): Promise<AdminNotes> {
    try {
      const note = await this.NoteService.updateAdminNote(id, updatedNoteData);
      return note;
    } catch (error) {
      throw new HttpException(
        'Failed to update folder',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('delete/note/:id')
  @UseGuards(JwtAuthGuard)
  async deleteAdminNote(
    @Param('id') id: number,
  ): Promise<void> {
    try {
      await this.NoteService.deleteAdminNote(id);
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
  ): Promise<AdminNotes> {
    try {
      const note = await this.NoteService.getAdminNoteDetailById(id);
      return note;
    } catch (error) {
      throw new HttpException(
        'Folder not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('mark-note-as-read')
  @UseGuards(JwtAuthGuard)
  async markNoteAsRead(
    @Body('noteId') noteId: number,
    @Body('userId') userId: number,
    @Req() req,
  ): Promise<void> {
    userId = (req.user as { userId: number }).userId
    await this.NoteService.markNoteAsRead(noteId, userId);
  }

}
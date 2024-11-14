import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Res,
  NotFoundException,
  Delete,
  Headers,
  BadRequestException,
  Put,
  ParseIntPipe,
  HttpStatus,
  Patch,
  HttpException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../jwtGuard/jwt-auth.guard';
import { Response } from 'express';
import { Express } from 'express';
import { multerOptions } from '../multerOptions';
import * as path from 'path';
import { UserService } from 'src/service/user.service';
import { User } from 'src/user.entity';
import { CustomLogger } from 'src/logger/logger.service';
import { Contact } from 'src/contact.entity';
import { BannedGuard } from 'src/jwtGuard/banned.guard';


@Controller('users')
export class UserController {
  constructor(private userService: UserService,
    private readonly logger: CustomLogger,

  ) { }

  @Put(':id/update')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('uploadedFile', multerOptions))
  async updateUserInfo(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
    @Param('id', ParseIntPipe) userId: number,
    @Body('username') username?: string,
  ) {
    const id = (req.user as { userId: number }).userId;
    if (id !== userId) {
      throw new Error('Unauthorized');
    }

    const uploadedFile = file ? file.filename : null;
    const updatedUser = await this.userService.updateUserInfo(userId, username, uploadedFile);

    return {
      ...updatedUser,
      updatedFileName: uploadedFile,

    };
  }

  //delete picture
  @Delete(':id/deletePicture')
  @UseGuards(JwtAuthGuard)
  async deleteProfilPic(
    @Req() req,
    @Param('id', ParseIntPipe) userId: number
  ) {
    const id = (req.user as { userId: number }).userId;
    if (id !== userId) {
      throw new Error('unauthorized')
    }
    return await this.userService.deleteProfilPic(userId);
  }

  @Get('user/:id')
  @UseGuards(JwtAuthGuard, BannedGuard)
  async getUserInfo(@Param('id') id: number) {
    const user = await this.userService.getUserInfo(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  //   // Check if the user is banned
  //   if (user.status === 'banned') {  // Ensure this matches the status options in the User entity
  //     throw new ForbiddenException('User is banned');
  // }
    return user;
  }

  @Get('admin/:id')
  async getAdminInfo(@Param('id') id: number) {
    const admin = await this.userService.getAdminInfo(id);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return admin; // Return the admin data here
  }

  @Patch('blockUser/:id')
  @UseGuards(JwtAuthGuard)
  async blockUser(
    @Param('id') id: number,
    @Body() body: { blocked: boolean },
    @Res() res: Response
  ) {
    try {
      const user = await this.userService.blockUser(id, body.blocked);
      res.status(200).send(user);
    } catch (error) {
      this.logger.error('Error blocking user:', error.message);
      res.status(400).send({ message: error.message });
    }
  }

  @Get('GetAllUser')
  @UseGuards(JwtAuthGuard)
  async getAllUser(): Promise<User[]> {
    return await this.userService.getAllUser()
  }

  // Endpoint to request account deletion
  @Delete('request-deletion/:id')
  @UseGuards(JwtAuthGuard)
  async requestAccountDeletion(@Param('id') id: number, @Req() req) {
    try {
      const id = (req.user as { userId: number }).userId;
      const user = await this.userService.requestAccountDeletion(id);
      return { message: 'Account deletion requested. Your account will be permanently deleted after 30 days.', user };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  // Private endpoint to delete expired accounts (optional)
  @Delete('delete-expired')
  @UseGuards(JwtAuthGuard)
  async deleteExpiredAccounts() {
    await this.userService.deleteExpiredAccounts();
    return { message: 'Expired accounts deleted successfully.' };
  }

  @Post('cancel-deletion')
  async cancelDeletion(@Body('id') userId: number): Promise<User> {
    return this.userService.cancelAccountDeletion(userId);
  }


  @Post('contact')
  async contactUs(
    @Body()contactData:Partial<Contact> 
  ) {
    return await this.userService.ContactUs(contactData)
  }

  @Get('getAllUserContactForm')
  async getAllContactForm(): Promise<Contact[]> {
    return await this.userService.getAllContactForm();
  }
}
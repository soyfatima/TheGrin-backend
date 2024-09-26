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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../jwtGuard/jwt-auth.guard';
import { Response } from 'express';
import { Express } from 'express';
import { multerOptions } from '../multerOptions';
import * as path from 'path';
import { UserService } from 'src/service/user.service';
import { User } from 'src/user.entity';


@Controller('users')
export class UserController {
  constructor(private userService: UserService) { }

  @UseGuards(JwtAuthGuard)
  @Put(':id/update')
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
  @UseGuards(JwtAuthGuard)
  @Delete(':id/deletePicture')
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

  @UseGuards(JwtAuthGuard)
  @Get('user/:id')
  async getUserInfo(@Param('id') id: number) {
    const user = await this.userService.getUserInfo(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
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

  @UseGuards(JwtAuthGuard)
  // @Patch('blockUser')
  @Patch('blockUser/:id')
  async blockUser(
    @Param('id') id: number,
    @Body() body: { blocked: boolean },
    @Res() res: Response
  ) {
    try {
      const user = await this.userService.blockUser(id, body.blocked);
      res.status(200).send(user);
    } catch (error) {
     // console.error('Error blocking user:', error.message);
      res.status(400).send({ message: error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('GetAllUser')
  async getAllUser(): Promise<User[]> {
    return await this.userService.getAllUser()
  }

}
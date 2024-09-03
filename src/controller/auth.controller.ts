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
import { AuthService } from 'src/service/auth.service';
import { CartService } from 'src/service/cart.service';

// login.dto.ts
export class LoginDto {
  email: string;
  password: string;
}
export class UserLoginDto {
  username: string;
  password: string;
}

export class userSignupDto {
  username: string;
  password: string;
  email: string;
  gender: string
}

@Controller('auth')
export class AuthController {
  profilePicturesController: any;
  constructor(private authService: AuthService,
    private readonly cartService: CartService,
  ) { }

  //refresh token
  @UseGuards(JwtAuthGuard)
  @Post('refresh-token')
  async refreshAccessToken(
    @Body() { refreshToken }: { refreshToken: string },
  ): Promise<{ accessToken: string }> {
    const newAccessToken =

      await this.authService.refreshAccessToken(refreshToken);

    console.log(newAccessToken, 'new access token')

    return { accessToken: newAccessToken };
  }

  //admin login
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = loginDto;
    const user = await this.authService.validateAdmin(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = this.authService.generateRefreshToken(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
    });

    return { accessToken, refreshToken, userInfo: user, role: user.role };
  }

  //user signup
  @Post('userSignup')
  async userSignup(
    @Body() userSignupDto: userSignupDto,
    @Res() res: Response,
  ): Promise<void> {
    const { email, username, password, gender } = userSignupDto;
    try {
      const accessToken = await this.authService.userSignup(
        email,
        username,
        password,
        gender
      );
      const user = await this.authService.getUserByEmail(email);
      await this.cartService.createCartForUser(user.id);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
      });
      res.status(200).send({ accessToken });
    } catch (error) {
      console.error('Error during sign up:', error.message);
      res.status(400).send({ message: error.message });
    }
  }

  //user login
  // @Post('userLogin')
  // async userLogin(@Body() userLoginDto: UserLoginDto, @Res() res: Response): Promise<void> {
  //   const { username, password } = userLoginDto;
  //   try {
  //     const { user, role } = await this.authService.userLogin(username, password);
  //     if (!user) {
  //       throw new UnauthorizedException('Invalid credentials');
  //     }

  //     const accessToken = this.authService.generateAccessToken(user);
  //     const refreshToken = this.authService.generateRefreshToken(user);

  //     console.log(accessToken, 'accesstoken'),
  //     console.log(refreshToken, 'refreshtoken'),

  //     // Set tokens as cookies in the response
  //     res.cookie('accessToken', accessToken, {
  //       httpOnly: true,
  //       secure: false,
  //       sameSite: 'strict',
  //     });
  //     res.cookie('refreshToken', refreshToken, {
  //       httpOnly: true,
  //       secure: false,
  //       sameSite: 'strict',
  //     });

  //     res.status(200).send({ accessToken, refreshToken, userInfo: user, role });
  //   } catch (error) {
  //     console.error('Error during login:', error.message);
  //     res.status(400).send({ message: error.message });
  //   }
  // }

  @Post('userLogin')
  async userLogin(@Body() userLoginDto: UserLoginDto, @Res() res: Response): Promise<void> {
    const { username, password } = userLoginDto;

    try {
      const { user, role } = await this.authService.userLogin(username, password);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const accessToken = this.authService.generateAccessToken(user);
      const refreshToken = this.authService.generateRefreshToken(user);

      console.log('Access Token:', accessToken);
      console.log('Refresh Token:', refreshToken);

      // Set tokens as cookies in the response
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
        sameSite: 'strict',
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
        sameSite: 'strict',
      });

      res.status(HttpStatus.OK).send({ accessToken, refreshToken, userInfo: { ...user, role } });
    } catch (error) {
      console.error('Error during login:', error.message);
      res.status(HttpStatus.UNAUTHORIZED).send({ message: error.message });
    }
  }

  @Post('reset-code')
  async requestResetCode(@Body('email') email: string): Promise<void> {
    return this.authService.generateResetCode(email);
  }

  @Post('verify-code')
  async verifyResetCode(@Body('email') email: string, @Body('code') code: string): Promise<void> {
    const user = await this.authService.verifyResetCode(email, code);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset code.');
    }
  }

  @Post('reset-password')
  async resetPassword(@Body('email') email: string, @Body('code') code: string, @Body('newPassword') newPassword: string): Promise<void> {
    await this.authService.resetPassword(email, code, newPassword);
  }

  //logout
  @Post('logout')
  async logout(
    @Body('accessToken') accessToken: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      await this.authService.logout(accessToken);
      res.clearCookie('accessToken'); // Clear the access token cookie
      res.status(200).send();
    } catch (error) {
      console.error('Error during logout:', error.message);
      res.status(400).send({ message: error.message });
    }
  }

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
    const updatedUser = await this.authService.updateUserInfo(userId, username, uploadedFile);

    return {
      ...updatedUser,
      updatedFileName: uploadedFile,

    };
  }

  //@UseGuards(JwtAuthGuard)
  @Get('user/:id')
  async getUserInfo(@Param('id') id: number) {
    const user = await this.authService.getUserInfo(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get('admin/:id')
  async getAdminInfo(@Param('id') id: number) {
    const admin = await this.authService.getAdminInfo(id);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }
    return admin; // Return the admin data here
  }
  


  @Patch('blockUser')
  async blockUser(
    @Param('id') id: number,
    @Body() body: { blocked: boolean },
    @Res() res: Response
  ) {
    console.log('Received request to block/unblock user:', { id, blocked: body.blocked });
    try {
      const user = await this.authService.blockUser(id, body.blocked);
      res.status(200).send(user);
    } catch (error) {
      console.error('Error blocking user:', error.message);
      res.status(400).send({ message: error.message });
    }
  }

}

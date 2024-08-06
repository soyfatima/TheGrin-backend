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
  gender:string
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
    // Set tokens as cookies in the response
    //console.log('access token', accessToken),
    //console.log('refresh token',refreshToken)
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
    const { email, username, password,gender } = userSignupDto;
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
      //console.log('access token', accessToken),
      //console.log('refresh token',refreshToken)
      // Set tokens as cookies in the response
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
  
      res.status(200).send({ accessToken, refreshToken, userInfo: user, role });
    } catch (error) {
      console.error('Error during login:', error.message);
      res.status(400).send({ message: error.message });
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

  //verify status of log user
  @Post('verify-token')
  async verifyToken(
    @Body() body: { accessToken: string },
  ): Promise<{ valid: boolean; userId: number | null }> {
    const { accessToken } = body;
    const isValid = await this.authService.verifyToken(accessToken);
    //console.log(this.verifyToken, 'verify token')
    return { valid: isValid !== null, userId: isValid };
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
    @UploadedFile() file,
    @Req() req,
    @Param('id', ParseIntPipe) userId: number,
    @Body('username') username?: string,
  ) {
    const id = (req.user as { userId: number }).userId;
    if (id !== userId) {
      throw new Error('Unauthorized');
    }
    const uploadedFile = file ? file.filename : null;
    return this.authService.updateUserInfo(userId, username, uploadedFile);
  }
  
}

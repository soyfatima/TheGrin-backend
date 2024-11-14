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
import { CustomLogger } from 'src/logger/logger.service';

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
    private readonly logger: CustomLogger,

  ) { }

  //refresh token
  @Post('refresh-token')
  @UseGuards(JwtAuthGuard)
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
      this.logger.error('Error during sign up:', error.message);
      res.status(400).send({ message: error.message });
    }
  }

  // @Post('userLogin')
  // async userLogin(@Body() userLoginDto: UserLoginDto, @Res() res: Response): Promise<void> {
  //   const { username, password, consent } = userLoginDto;

  //   try {
  //     const { user, role } = await this.authService.userLogin(username, password, consent);
  //     if (!user) {
  //       throw new UnauthorizedException('Invalid credentials');
  //     }

  //     const accessToken = this.authService.generateAccessToken(user);
  //     const refreshToken = this.authService.generateRefreshToken(user);

  //     // Set tokens as cookies in the response only if the user has consented
  //     if (consent) {
  //       res.cookie('accessToken', accessToken, {
  //         httpOnly: true,
  //         secure: process.env.NODE_ENV === 'production',
  //         sameSite: 'strict',
  //         maxAge: 15 * 60 * 1000, // 15 minutes
  //       });
  //       res.cookie('refreshToken', refreshToken, {
  //         httpOnly: true,
  //         secure: process.env.NODE_ENV === 'production',
  //         sameSite: 'strict',
  //         maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  //       });
  //     }

  //     res.status(HttpStatus.OK).send({ accessToken, refreshToken, userInfo: { ...user, role } });
  //   } catch (error) {
  //     this.logger.error('Error during login:', error.message);
  //     res.status(HttpStatus.UNAUTHORIZED).send({ message: error.message });
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

      // Vous pouvez choisir d’envoyer les jetons en réponse JSON sans cookies
      res.status(HttpStatus.OK).send({
        accessToken,
        refreshToken,
        userInfo: { ...user, role },
      });
    } catch (error) {
      this.logger.error('Error during login:', error.message);
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
      res.clearCookie('accessToken');
      res.status(200).send({ message: 'Logged out successfully' });
    } catch (error) {
      this.logger.error('Error during logout:', error);
      res.status(400).send({ message: error.message });
    }
  }


}

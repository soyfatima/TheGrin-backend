import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Admin } from 'src/admin.entity';
import * as bcrypt from 'bcrypt';

import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { jwtConfig } from 'src/jwtGuard/config';
import { User } from 'src/user.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { randomBytes } from 'crypto';
import { throwError } from 'rxjs';
import { CustomLogger } from 'src/logger/logger.service';

@Injectable()
export class AuthService {
  private readonly predefinedEmail = 'contact@docteur.com';
  private readonly predefinedPassword = 'Doc@dash';

  private readonly predefineUsername = 'admin';
  private readonly predefineAdminPassword = 'admin00'

  constructor(
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly logger: CustomLogger,

  ) { }

  public getJwtSecret(): string {
    return jwtConfig.secret;
  }

  // generateAccessToken(user: User | Admin): string {
  //   //const payload = { userId: user.id, };
  //   const payload = { userId: user.id, role: user instanceof Admin ? 'admin' : 'user' }; 
  //   const options = { expiresIn: '15m' };
  //   const token = this.jwtService.sign(payload, options);
  //   return token;
  // }

  // generateRefreshToken(user: User | Admin): string {
  //   const payload = { userId: user.id, role:user instanceof Admin ? 'admin' : 'user' };
  //   const options = { expiresIn: '1d' };
  //   const token = this.jwtService.sign(payload, options);
  //   return token;
  // }
  generateAccessToken(payload: { userId: number, role: string }): string {
    console.log('Generating Access Token with Payload:', payload); // Log payload for debugging
    const options = { expiresIn: '15m' };
    const token = this.jwtService.sign(payload, options); // Ensure payload has both userId and role
    return token;
  }
  
  generateRefreshToken(payload: { userId: number, role: string }): string {
    console.log('Generating Refresh Token with Payload:', payload); // Log payload for debugging
    const options = { expiresIn: '1d' };
    const token = this.jwtService.sign(payload, options); // Ensure payload has both userId and role
    return token;
  }
  
  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const decodedToken = this.jwtService.verify(refreshToken);
      const { userId, role } = decodedToken;
  
      const user = await this.userRepository.findOne({ where: { id: userId } }) ||
        await this.adminRepository.findOne({ where: { id: userId } });
  
      if (!user) {
        this.logger.error('User not found for refresh token. User ID:', userId);
        throw new UnauthorizedException('User not found');
      }
  
      // Ensure correct role assignment when refreshing the token
      const newAccessToken = this.generateAccessToken({
        userId: user.id,
        role: user instanceof Admin ? 'admin' : 'user', // Ensure correct role assignment
      });
  
      return newAccessToken;
    } catch (error) {
      this.logger.error('Error refreshing access token:', error.message);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
  
    
  async validateAdmin(email: string, password: string): Promise<any> {
    if (
      email === this.predefinedEmail &&
      password === this.predefinedPassword
    ) {
      return { email: this.predefinedEmail, role: 'admin' };
    }
    return null;
  }

  async login(adminId: number) {
    const payload = { adminId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async userSignup(email: string, username: string, password: string, gender: string): Promise<string> {
    try {
      const existingEmail = await this.userRepository.findOne({
        where: { email },
      });
      if (existingEmail) {
        throw new BadRequestException('Email already exists');
      }

      // Vérifie si le nom d'utilisateur est en format d'e-mail
      if (/^\S+@\S+\.\S+$/.test(username)) {
        throw new BadRequestException(
          'Email address cannot be used as username',
        );
      }
      // Check if the username is "admin"
      if (username.toLowerCase() === 'admin') {
        throw new BadRequestException('The username "admin" is reserved and cannot be used');
      }

      // Vérifie si le nom d'utilisateur est déjà utilisé
      const existingUser = await this.userRepository.findOne({
        where: { username },
      });
      if (existingUser) {
        throw new BadRequestException('Username already exists');
      }

      // Ensure gender is provided if required
      if (!gender) {
        throw new BadRequestException('Please select a gender');
      }

      // Crée un nouvel utilisateur avec l'e-mail, le nom d'utilisateur et le mot de passe
      const newUser = this.userRepository.create({ email, username, password, gender });
      await newUser.hashPassword();
      const user = await this.userRepository.save(newUser);

      // Génère et retourne le jeton d'accès
    //  const accessToken = this.generateAccessToken(user);
    const accessToken = this.generateAccessToken({
      userId: user.id, 
      role: 'user'  // assuming user role is 'user'
    });

      return accessToken;
    } catch (error) {
      this.logger.error('Error during sign up:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

  // async userLogin(username: string, password: string): Promise<{ user: User | Admin; role: string }> {
  //   try {
  //     // Handle admin login
  //     if (username === this.predefineUsername) {
  //       const admin = await this.adminRepository.findOne({
  //         where: { username: this.predefineUsername },
  //       });
  
  //       if (!admin) {
  //         throw new UnauthorizedException('Admin user does not exist');
  //       }
  
  //       // Compare the password
  //       const isPasswordValid = password === this.predefineAdminPassword;
  //       if (!isPasswordValid) {
  //         throw new UnauthorizedException('Invalid username or password');
  //       }
  
  //       return { user: admin, role: 'admin' }; // Role should be 'admin'
  //     }
  
  //     // Handle regular user login
  //     const user = await this.userRepository.findOne({
  //       where: { username }
  //     });
  
  //     if (!user) {
  //       throw new UnauthorizedException('Invalid username or password');
  //     }
  
  //     // if (user.blocked) {
  //     //   throw new UnauthorizedException('User is blocked');
  //     // }
  
  //     if (user.blocked) {
  //       throw new HttpException(
  //         { message: 'User is blocked' }, // Custom message field
  //         HttpStatus.UNAUTHORIZED
  //       );
  //     }
  //     const isPasswordValid = await user.comparePassword(password);
  
  //     if (!isPasswordValid) {
  //       throw new UnauthorizedException('Invalid username or password');
  //     }

  //     return { user, role: 'user' };
  //   } catch (error) {
  //    this.logger.error('Error during login:', error.message);
  //     throw new UnauthorizedException(error.message);
  //   }
  // }

  async userLogin(
    username: string,
    password: string
  ): Promise<{ user: User | Admin; role: string }> {
    try {
      // Handle admin login
      if (username === this.predefineUsername) {
        const admin = await this.adminRepository.findOne({
          where: { username: this.predefineUsername },
        });
  
        if (!admin) {
          throw new UnauthorizedException('Admin user does not exist');
        }
  
        // Compare the password
        const isPasswordValid = password === this.predefineAdminPassword;
        if (!isPasswordValid) {
          throw new UnauthorizedException('Invalid username or password');
        }
  
        return { user: admin, role: 'admin' }; // Role should be 'admin'
      }
  
      // Handle regular user login
      const user = await this.userRepository.findOne({
        where: { username }
      });
  
      if (!user) {
        throw new UnauthorizedException('Invalid username or password');
      }
  
      if (user.blocked) {
        throw new HttpException(
          { message: 'User is blocked' }, // Custom message field
          HttpStatus.UNAUTHORIZED
        );
      }
  
      const isPasswordValid = await user.comparePassword(password);
  
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid username or password');
      }
  
      return { user, role: 'user' }; // Role should be 'user' for regular users
    } catch (error) {
      this.logger.error('Error during login:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }
  
  async logout(accessToken: string): Promise<void> {
    try {
      const decodedToken = this.jwtService.verify(accessToken);
      const userId = decodedToken.userId;
      // Perform logout logic (maybe invalidate token here, if needed)
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token has expired');
      }
      this.logger.error('Error verifying token during logout:', error);
      throw new UnauthorizedException('Invalid access token');
    }
  }
  
  async generateResetCode(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a numeric code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    user.resetCodeExpiration = new Date(Date.now() + 3600000);
    await this.userRepository.save(user);

    // Send the reset code via email
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: 'Password Reset Code',
        html: `<p>Hello ${user.username},</p>
             <p>Your password reset code is:</p>
             <p><strong>${resetCode}</strong></p>`,
        //     from: '"thltechnologies" <no-reply@thltechserveur.com>',
      });
    } catch (error) {
     this.logger.error('Error sending email:', error);
    }
  }
  async verifyResetCode(email: string, code: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email, resetCode: code } });
    if (!user || user.resetCodeExpiration < new Date()) {
      return null;
    }
    return user;
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const user = await this.verifyResetCode(email, code);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset code.');
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = null;
    user.resetCodeExpiration = null;
    await this.userRepository.save(user);
  }

}
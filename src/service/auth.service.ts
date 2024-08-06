import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Admin } from 'src/admin.entity';
import * as bcrypt from 'bcrypt';

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConfig } from 'src/jwtGuard/config';
import { User } from 'src/user.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { randomBytes } from 'crypto';
import { throwError } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly predefinedEmail = 'contact@thltechnologies.com';
  private readonly predefinedPassword = 'THL@AdminBlog';

  constructor(
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  public getJwtSecret(): string {
    return jwtConfig.secret;
  }

  generateAccessToken(user: User | Admin): string {
    const payload = { userId: user.id };
    const options = { expiresIn: '15m' };
    const token = this.jwtService.sign(payload, options);
    return token;
  }

  generateRefreshToken(user: User | Admin): string {
    const payload = { userId: user.id };
    const options = { expiresIn: '1d' };
    const token = this.jwtService.sign(payload, options);
    return token;
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const decodedToken = this.jwtService.verify(refreshToken);
      const userId = decodedToken.userId;
      const user =
        (await this.userRepository.findOne(userId)) ||
        (await this.adminRepository.findOne(userId));
      if (!user) {
        console.error('User not found');
        throw new UnauthorizedException('User not found');
      }
      const newAccessToken = this.generateAccessToken(user);
      return newAccessToken;
    } catch (error) {
      console.error('Invalid refresh token:', error);
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
    // Generate JWT token upon successful authentication
    const payload = { adminId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  //backend service
  async userSignup(email: string, username: string, password: string, gender:string): Promise<string> {
    try {
      // Vérifie si l'e-mail est déjà utilisé
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
      const accessToken = this.generateAccessToken(user);
      return accessToken;
    } catch (error) {
      console.error('Error during sign up:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

  async userLogin(username: string, password: string): Promise<{ user: User | Admin; role: string }> {
    try {
      const user = await this.userRepository.findOne({ where: { username } });
      if (!user) {
        throw new UnauthorizedException('Invalid username or password');
      }
      // Compare the password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid username or password');
      }
      return { user, role: 'user' };
    } catch (error) {
      console.error('Error during login:', error.message);
      throw new UnauthorizedException(error.message);
    }
  }

  // Service method to verify token and extract user ID
  async verifyToken(accessToken: string): Promise<number | null> {
    try {
      const decodedToken = this.jwtService.verify(accessToken);
      const userId = decodedToken.userId;
      return userId;
    } catch (error) {
      return null;
    }
  }

  async logout(accessToken: string): Promise<void> {
    try {
      const decodedToken = this.jwtService.verify(accessToken);
      const userId = decodedToken.userId;
      return;
    } catch (error) {
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
      //console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
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

  async updateUserInfo(userId: number, username?: string, uploadedFile?: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    if (username) {
      user.username = username;
    }
  
    if (uploadedFile) {
      user.uploadedFile = uploadedFile;
    }
  
    await this.userRepository.save(user);
    return user;
  }
  
}

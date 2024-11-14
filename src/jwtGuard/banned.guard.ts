// banned.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/service/user.service';

@Injectable()
export class BannedGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    console.log('Authorization header:', authHeader); // Log the header to see the token

    if (!authHeader) {
      console.log('No authorization header present');
      return false;
    }

    const token = authHeader.split(' ')[1];
    console.log('Extracted token:', token); // Log the token to verify it's being extracted

    let decoded;
    try {
      decoded = this.jwtService.verify(token); // Verify the token
      console.log('Decoded token:', decoded); // Log the decoded token
    } catch (error) {
      console.error('JWT verification failed', error);
      return false; // Token verification failed, don't proceed
    }

    const user = await this.userService.getUserInfo(decoded.userId);
    console.log('Fetched user from database:', user); // Log the user object fetched from DB

    if (!user) {
      console.log('User not found in database');
      return false; // If the user is not found, prevent access
    }

    console.log('User status:', user.status); // Log the user's status

    // Check if the user is banned
    if (user.status === 'banned') {
      console.log('User is banned, access denied');
      return false;
    }

    console.log('User is not banned, access granted');
    return true; // If the user is not banned, proceed with the request
  }
}

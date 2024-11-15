// banned.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { CustomLogger } from 'src/logger/logger.service';
import { UserService } from 'src/service/user.service';

@Injectable()
export class BannedGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly logger: CustomLogger,

    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];

        if (!authHeader) {
            throw new ForbiddenException('Access token missing');
        }

        const token = authHeader.split(' ')[1];
        this.logger.log(`Token extracted: ${token}`);
        let decoded;
        try {
            decoded = this.jwtService.verify(token);
            this.logger.log(`Decoded token: ${decoded}`);

        } catch (error) {
            this.logger.error('JWT verification failed:', error);
            throw new ForbiddenException('Invalid token');
        }

        const user = await this.userService.getUserInfo(decoded.userId);
        this.logger.log(`Fetched user: ${user}`);

        if (user.status === 'banned') {
            this.logger.log('User is banned, access denied');
            throw new ForbiddenException('User is banned');
        }

        this.logger.log('User is not banned, access granted');
        return true;
    }

}

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
        let decoded;
        try {
            decoded = this.jwtService.verify(token);
        } catch (error) {
            this.logger.error('JWT verification failed:', error);
            throw new ForbiddenException('Invalid token');
        }

        if (decoded.role === 'admin') {
            return true;
        }

        // Fetch the user information if not admin
        const user = await this.userService.getUserInfo(decoded.userId);

        if (!user) {
            this.logger.error('User not found');
            throw new ForbiddenException('User not found');
        }

        if (user.status === 'banned') {
            throw new ForbiddenException('User is banned');
        }

        return true;
    }


}

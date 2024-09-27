import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Admin } from 'src/admin.entity';
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/user.entity';
import { throwError } from 'rxjs';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(Admin)
        private readonly adminRepository: Repository<Admin>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

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

    async deleteProfilPic(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('user not found');
        }
        user.uploadedFile = null;
        await this.userRepository.save(user);
        return user;
    }

    async getUserInfo(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    async getAdminInfo(id: number): Promise<Admin> {
        const admin = await this.adminRepository.findOne({ where: { id: id } })

        if (!admin) {
            throw new Error('admin not found');
        }
        return admin;
    }

    async blockUser(userId: number, blocked: boolean): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } })

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        user.blocked = blocked;

        if (blocked) {
            user.status = 'banned';
        
        } else {
            user.status = 'active';
        }

        return await this.userRepository.save(user)
    }

    async getAllUser(): Promise<User[]> {
        return await this.userRepository.find()
    }


}
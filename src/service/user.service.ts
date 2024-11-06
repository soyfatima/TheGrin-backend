import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
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
import { CustomLogger } from 'src/logger/logger.service';
import { Contact } from 'src/contact.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(Admin)
        private readonly adminRepository: Repository<Admin>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
        private readonly logger: CustomLogger,

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

    async requestAccountDeletion(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        // Mark the account for deletion 30 days from the current date
        user.deletionRequestedAt = new Date();
        user.status = 'left'
        await this.userRepository.save(user);

        return user;
    }

    // Scheduled job to delete accounts after 30 days
    async deleteExpiredAccounts(): Promise<void> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const usersToDelete = await this.userRepository.find({
            where: {
                deletionRequestedAt: LessThan(thirtyDaysAgo),
            },
        });

        for (const user of usersToDelete) {
            await this.userRepository.delete(user.id);
        }
    }

    async cancelAccountDeletion(userId: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        // Clear the deletionRequestedAt date to cancel the deletion request
        user.deletionRequestedAt = null;
        user.status = 'active'
        await this.userRepository.save(user);

        return user;
    }

    async ContactUs(contactData: Partial<Contact>): Promise<Contact> {
        const contact = this.contactRepository.create(contactData);
        return await this.contactRepository.save(contact);
    }

    async getAllContactForm():Promise<Contact[]> {
        return this.contactRepository.find()
    }
}
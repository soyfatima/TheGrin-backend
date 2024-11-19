import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from 'src/report.entity';
import { User } from 'src/user.entity';
import { Comment } from 'src/comment.entity';
import { Folder } from 'src/folder.entity';
import { CustomLogger } from 'src/logger/logger.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

@Injectable()
export class ReportService {
    constructor(
        @InjectRepository(Report)
        private readonly reportRepository: Repository<Report>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
        @InjectRepository(Folder)
        private folderRepository: Repository<Folder>,
        private readonly logger: CustomLogger,
        private notificationService: NotificationService,
       private authService: AuthService
    ) { }


    async reportUser(UserId: number, reportedUserId: number, reportData: Partial<Report> , req: Request): Promise<Report> {
        // Find the reported user by ID
        const reportedUser = await this.userRepository.findOne({ where: { id: reportedUserId } });

        if (!reportedUser) {
            throw new NotFoundException('User not found');
        }

        // Check if the reported user is banned
        if (reportedUser.status === 'banned') {
            throw new ConflictException('This user has already been banned');
        }

        // Find the reporter user by ID
        const reporterUser = await this.userRepository.findOne({ where: { id: UserId } });

        if (!reporterUser) {
            throw new NotFoundException('Reporter not found');
        }

        const existingReport = await this.reportRepository.findOne({
            where: { user: { id: reportedUser.id }, reporter: { id: UserId } }
        });

        if (existingReport) {
            throw new ConflictException('You have already reported this user.');
        }

        // Create the new report
        const report = this.reportRepository.create({
            ...reportData,
            reporter: { id: UserId },
            user: { id: reportedUser.id }
        });

       // console.log('report data', report)
        await this.reportRepository.save(report);

        // Count the total number of reports for the reported user
        const reportCount = await this.reportRepository.count({ where: { user: { id: reportedUser.id } } });

        if (reportCount > 4) {
            await this.userRepository.update(reportedUser.id, {
                blocked: true,
                status: 'banned'
            });
        
            // logout the banned user
            const accessToken = req.headers['authorization']?.replace('Bearer ', ''); 
    
            if (accessToken) {
                await this.authService.logout(accessToken); 
            }

            await this.reportRepository.delete({ user: { id: reportedUser.id } });
        }

        return report;
    }

    async createReportByComment(commentId: number, UserId: number, reportData: Partial<Report>): Promise<Report> {
        const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['user','folder'] });
        if (!comment) {
            throw new NotFoundException('This comment has already been deleted.');
        }

        const reportedUser = comment.user; // The user who made the comment
        const reporterUser = await this.userRepository.findOne({ where: { id: UserId } });

        if (!reportedUser || !reporterUser) {
            throw new NotFoundException('Reported user or reporter not found');
        }

        const existingReport = await this.reportRepository.findOne({
            where: { comment: { id: commentId }, reporter: { id: UserId } }
        });

        if (existingReport) {
            throw new ConflictException('You have already reported this comment.');
        }

        const report = this.reportRepository.create({
            ...reportData,
            reporter: { id: UserId },
            user: { id: reportedUser.id },
            comment: { id: commentId }
        });

        await this.reportRepository.save(report);
        const reportCount = await this.reportRepository.count({ where: { comment: { id: commentId } } });

        if (reportCount >= 4) {
            await this.incrementUserWarningCount(reportedUser.id);
            await this.commentRepository.delete(commentId);

            const folderName =comment.folder?.title;
            const message = `Votre commentaire sur le poste "${folderName}" a été signalé comme contenu inapproprié et a été supprimé. Pour plus d’informations, veuillez consulter les consignes d’utilisation afin d’éviter le bannissement de votre compte.`;
            await this.notificationService.createNotifForWarning(reportedUser.id, message);
        }

        return report;
    }

    async createReportByReply(replyId: number, userId: number, reportData: Partial<Report>): Promise<Report> {
        const reply = await this.commentRepository.findOne({
            where: { id: replyId },
            relations: ['user', 'folder', 'parent', 'parent.folder', 'replies']
        });

        if (!reply) {
            throw new NotFoundException('This reply has already been deleted.');
        }

        const reportedUser = reply.user; // The user who made the reply
        const reporterUser = await this.userRepository.findOne({ where: { id: userId } });

        if (!reportedUser || !reporterUser) {
            throw new NotFoundException('Reported user or reporter not found.');
        }

        // Check if the same user has already reported this reply
        const existingReport = await this.reportRepository.findOne({
            where: { reply: { id: replyId }, reporter: { id: userId } }
        });

        if (existingReport) {
            throw new ConflictException('You have already reported this reply.');
        }

        // Create a new report
        const report = this.reportRepository.create({
            ...reportData,
            reporter: { id: userId },
            user: { id: reportedUser.id },
            reply: { id: replyId }
        });

        await this.reportRepository.save(report);

        // Count the total number of reports for this reply
        const reportCount = await this.reportRepository.count({ where: { reply: { id: replyId } } });
        if (reportCount >= 4) {
            await this.incrementUserWarningCount(reportedUser.id);
            await this.commentRepository.delete(replyId);

          //  const folderTitle = reply.folder?.title
          const folderTitle = reply.parent?.folder?.title;
            const message = `Votre réponse sur le poste "${folderTitle}" a été signalé comme contenu inapproprié et a été supprimé. Pour plus d’informations, veuillez consulter les consignes d’utilisation afin d’éviter le bannissement de votre compte.`;

            await this.notificationService.createNotifForWarning(reportedUser.id, message);
        }

        return report;
    }

    async createReportByFolder(folderId: number, userId: number, reportData: Partial<Report>): Promise<Report> {
        const folder = await this.folderRepository.findOne({ where: { id: folderId }, relations: ['user'] });
        if (!folder) {
            throw new NotFoundException('This folder has already been deleted.');
        }

        const reportedUser = folder.user; // The user who made the folder
        const reporterUser = await this.userRepository.findOne({ where: { id: userId } });
        if (!reportedUser || !reporterUser) {
            throw new NotFoundException('Reported user or reporter not found');
        }

        const existingReport = await this.reportRepository.findOne({
            where: { folder: { id: folderId }, reporter: { id: userId } },
        });

        if (existingReport) {
            throw new ConflictException('You have already reported this folder.');
        }

        const report = this.reportRepository.create({
            ...reportData,
            reporter: { id: userId },
            user: { id: reportedUser.id },
            folder: { id: folderId },
        });
        await this.reportRepository.save(report);

        // Count how many reports exist for this folder
        const reportCount = await this.reportRepository.count({
            where: { folder: { id: folderId } },
        });

        if (reportCount >= 4) {
            await this.incrementUserWarningCount(reportedUser.id);
            await this.folderRepository.delete(folderId);
            const folderName = folder.title; 
             const message = `Votre poste "${folderName}" a été signalé comme contenu inapproprié et a été supprimé. Pour plus d’informations, veuillez consulter les consignes d’utilisation afin d’éviter le bannissement de votre compte.`;
            await this.notificationService.createNotifForWarning(reportedUser.id, message);
        }

        return report;
    }

    async incrementUserWarningCount(userId: number): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        user.warningCount = (user.warningCount || 0) + 1;

        if (user.warningCount >= 8) {
            user.blocked = true;
            user.status = 'banned';
        }

        try {
            await this.userRepository.save(user);
        } catch (error) {
            this.logger.error(`Error saving user ${userId}: `, error);
            throw new InternalServerErrorException('Failed to save user warning count');
        }
    }


}

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
        @InjectRepository(User) // Inject the User repository
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

        // Check if this user has already reported the same user
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

        console.log('report data', report)
        await this.reportRepository.save(report);

        // Count the total number of reports for the reported user
        const reportCount = await this.reportRepository.count({ where: { user: { id: reportedUser.id } } });

        // If the report count exceeds 2, block and ban the reported user
        if (reportCount > 2) {
            await this.userRepository.update(reportedUser.id, {
                blocked: true,
                status: 'banned'
            });
        

            console.log(`User ${reportedUserId} has been banned`);

            // Call the auth service to logout the banned user
            const accessToken = req.headers['authorization']?.replace('Bearer ', ''); // Get the token from the request header
    
            if (accessToken) {
                console.log(`Logging out banned user ${reportedUserId}`);
                await this.authService.logout(accessToken); // Pass the user's access token to logout
                console.log(`User ${reportedUserId} has been logged out`);
            }
    

            await this.reportRepository.delete({ user: { id: reportedUser.id } });
            console.log(`Deleted all reports for banned user ${reportedUserId}`);
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

        // Count how many reports exist for the user being reported (from the comment)
        // const reportCount = await this.reportRepository.count({
        //     where: { user: { id: reportedUser.id } }, // Count reports for the reported user
        // });

        const reportCount = await this.reportRepository.count({ where: { comment: { id: commentId } } });

        // if (reportCount > 4) {
        //     // Block the user
        //     // await this.userRepository.update(reportedUser.id, {
        //     //     blocked: true,
        //     //     status: 'banned',
        //     // });

        //     // Delete all related reports for the comment
        //     await this.reportRepository.delete({ comment: { id: commentId } });
        //     // Delete the comment itself
        //     const deleteResult = await this.commentRepository.delete(commentId);

        //     if (deleteResult.affected === 0) {
        //         throw new NotFoundException(`Comment with ID ${commentId} could not be deleted or doesn't exist.`);
        //     } else {
        //     }
        // }

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
        // if (reportCount >= 4) {
        //     await this.reportRepository.delete({ reply: { id: replyId } });
        //     // Delete the reply itself
        //     const deleteResult = await this.commentRepository.delete(replyId);
        //     if (deleteResult.affected === 0) {
        //         throw new NotFoundException(`Reply with ID ${replyId} could not be deleted or doesn't exist.`);
        //     }
        // }

        if (reportCount >= 2) {
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
        // if (reportCount >= 4) {
        //     await this.reportRepository.delete({ folder: { id: folderId } });
        //     // Delete the folder
        //     const deleteResult = await this.folderRepository.delete(folderId);
        //     if (deleteResult.affected === 0) {
        //         throw new NotFoundException(`Folder with ID ${folderId} could not be deleted or doesn't exist.`);
        //     } else {
        //     }
        // }

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

        if (user.warningCount >= 2) {
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

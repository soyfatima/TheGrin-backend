import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from 'src/report.entity';
import { User } from 'src/user.entity';
import { Comment } from 'src/comment.entity';
import { Folder } from 'src/folder.entity';

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

    ) { }


    async createReportByComment(commentId: number, UserId: number, reportData: Partial<Report>): Promise<Report> {

        const comment = await this.commentRepository.findOne({ where: { id: commentId }, relations: ['user'] });
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

        if (reportCount > 4) {
            // Block the user
            // await this.userRepository.update(reportedUser.id, {
            //     blocked: true,
            //     status: 'banned',
            // });

            // Delete all related reports for the comment
            await this.reportRepository.delete({ comment: { id: commentId } });
            // Delete the comment itself
            const deleteResult = await this.commentRepository.delete(commentId);

            if (deleteResult.affected === 0) {
                throw new NotFoundException(`Comment with ID ${commentId} could not be deleted or doesn't exist.`);
            } else {
            }
        }

        return report;
    }

    async createReportByReply(replyId: number, userId: number, reportData: Partial<Report>): Promise<Report> {
        // Fetch the reply along with its associated user
        const reply = await this.commentRepository.findOne({ 
            where: { id: replyId }, 
            relations: ['user', 'folder', 'parent', 'replies'] 
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
            await this.reportRepository.delete({ reply: { id: replyId } });
            // Delete the reply itself
            const deleteResult = await this.commentRepository.delete(replyId);
            if (deleteResult.affected === 0) {
                throw new NotFoundException(`Reply with ID ${replyId} could not be deleted or doesn't exist.`);
            }
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
            await this.reportRepository.delete({ folder: { id: folderId } });
            // Delete the folder
            const deleteResult = await this.folderRepository.delete(folderId);
            if (deleteResult.affected === 0) {
                throw new NotFoundException(`Folder with ID ${folderId} could not be deleted or doesn't exist.`);
            } else {
            }
        }

        return report;
    }




}

import { Body, Controller, Param, Patch, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/jwtGuard/jwt-auth.guard";
import { ReportService } from "src/service/report.service";
import { Report } from 'src/report.entity';
import { param } from "jquery";
import { AuthGuard } from "@nestjs/passport";
import { CustomLogger } from "src/logger/logger.service";

@Controller('report')
export class ReportController {
    constructor(private reportService: ReportService,
    private readonly logger: CustomLogger,

    ) { }



    @UseGuards(JwtAuthGuard)
    @Post('report/user/:userId')
    async reportUser(
        @Param('userId') reportedUserId: number,
        @Req() req,
        @Body() reportData: Partial<Report>
    ): Promise<Report> {
        const reporterUserId = (req.user as { userId: number }).userId;
        const accessToken = req.headers['authorization']?.split(' ')[1]; // Get the access token from Authorization header
        if (!accessToken) {
            throw new UnauthorizedException('Access token is required');
        }
    
        return this.reportService.reportUser(reporterUserId, reportedUserId, reportData, accessToken)
    }

    @UseGuards(JwtAuthGuard)
    @Post('report/comment/:commentId')
    async reportComment(
        @Param('commentId') commentId: number,
        @Req() req,
        @Body() reportData: Partial<Report>
    ): Promise<Report> {
        const reporterUserId = (req.user as { userId: number }).userId;
        return this.reportService.createReportByComment(commentId, reporterUserId, reportData);
    }

    @UseGuards(JwtAuthGuard)
    @Post('report/reply/:replyId')
    async createReportByReply(
        @Param('replyId') replyId: number,
        @Req() req,
        @Body() reportData: Partial<Report>
    ): Promise<Report> {
        const reporterUserId = (req.user as { userId: number }).userId;
        return this.reportService.createReportByReply(replyId, reporterUserId, reportData)
    }


    @UseGuards(JwtAuthGuard)
    @Post('report/folder/:folderId')
    async createReportByFolder(
        @Param('folderId') folderId: number,
        @Req() req,
        @Body() reportData: Partial<Report>
    ): Promise<Report> {
        const reporterUserId = (req.user as { userId: number }).userId;
        return this.reportService.createReportByFolder(folderId, reporterUserId, reportData);
    }


    
  @Patch(':userId/warnings')
  @UseGuards(JwtAuthGuard)
  async incrementUserWarnings(@Param('userId') userId: number): Promise<void> {
    try {
      console.log(`Attempting to increment warning count for user ID: ${userId}`);
      await this.reportService.incrementUserWarningCount(userId);
      console.log(`User ID: ${userId} warning count incremented successfully`);
    } catch (error) {
      console.error(`Error incrementing warning count for user ID: ${userId}`, error);
      throw error;
    }
  }
}
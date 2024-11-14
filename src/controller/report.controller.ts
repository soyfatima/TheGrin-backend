import { Body, Controller, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
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



    @Post('report/user/:userId')
    @UseGuards(JwtAuthGuard)
    async reportUser(
        @Param('userId') reportedUserId: number,
        @Req() req,
        @Body() reportData: Partial<Report>
    ): Promise<Report> {
        const reporterUserId = (req.user as { userId: number }).userId;
        
        return this.reportService.reportUser(reporterUserId, reportedUserId, reportData, req)
    }

    @Post('report/comment/:commentId')
    @UseGuards(JwtAuthGuard)
    async reportComment(
        @Param('commentId') commentId: number,
        @Req() req,
        @Body() reportData: Partial<Report>
    ): Promise<Report> {
        const reporterUserId = (req.user as { userId: number }).userId;
        return this.reportService.createReportByComment(commentId, reporterUserId, reportData);
    }

    @Post('report/reply/:replyId')
    @UseGuards(JwtAuthGuard)
    async createReportByReply(
        @Param('replyId') replyId: number,
        @Req() req,
        @Body() reportData: Partial<Report>
    ): Promise<Report> {
        const reporterUserId = (req.user as { userId: number }).userId;
        return this.reportService.createReportByReply(replyId, reporterUserId, reportData)
    }


    @Post('report/folder/:folderId')
    @UseGuards(JwtAuthGuard)
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
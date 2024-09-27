import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/jwtGuard/jwt-auth.guard";
import { ReportService } from "src/service/report.service";
import { Report } from 'src/report.entity';
import { param } from "jquery";
import { AuthGuard } from "@nestjs/passport";

@Controller('report')
export class ReportController {
    constructor(private reportService: ReportService) { }



    @UseGuards(JwtAuthGuard)
    @Post('report/user/:userId')
    async reportUser(
        @Param('userId') reportedUserId: number,
        @Req() req,
        @Body() reportData: Partial<Report>
    ): Promise<Report> {
        const reporterUserId = (req.user as { userId: number }).userId;
        return this.reportService.reportUser(reporterUserId, reportedUserId, reportData)
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

}
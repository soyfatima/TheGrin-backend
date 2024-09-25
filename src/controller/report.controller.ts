import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/jwtGuard/jwt-auth.guard";
import { ReportService } from "src/service/report.service";
import { Report } from 'src/report.entity';
import { param } from "jquery";

@Controller('report')
export class ReportController {
    constructor(private reportService: ReportService) { }



    // @UseGuards(JwtAuthGuard)
    // @Post('report')
    // async createReport(
    //     @Param ('id') id:number,
    //     @Req() req,
    //     @Body() reportData: Partial<Report> // Use Partial<Report> here
    // ): Promise<Report> {
    //     const userId = (req.user as { userId: number }).userId;
    //     console.log('userid', userId)

    //     return this.reportService.createReport(userId, reportData);
    // }


    // @UseGuards(JwtAuthGuard)
    // @Post('report/:id') // The ID here is for the reported user
    // async createReport(
    //     @Param('id') reportedUserId: number, // This is the ID of the user being reported
    //     @Req() req,
    //     @Body() reportData: Partial<Report> // The report data
    // ): Promise<Report> {
    //     const reporterUserId = (req.user as { userId: number }).userId; // The logged-in user (reporter)

    //     console.log('Reporter User ID:', reporterUserId);
    //     console.log('Reported User ID:', reportedUserId);

    //     // Pass both the reporter and the reported user IDs to the service
    //     return this.reportService.createReport(reportedUserId, reporterUserId, reportData);
    // }



    @UseGuards(JwtAuthGuard)
    @Post('report/comment/:commentId') // The commentId is passed in the URL
    async reportComment(
        @Param('commentId') commentId: number, // Get the commentId from the URL
        @Req() req,
        @Body() reportData: Partial<Report> // The reason for reporting
    ): Promise<Report> {
        const reporterUserId = (req.user as { userId: number }).userId; // The user reporting the comment

        console.log('Reporter User ID:', reporterUserId);
        console.log('Comment ID:', commentId);

        // Pass the commentId and the reporterUserId to the service
        return this.reportService.createReportByComment(commentId, reporterUserId, reportData);
    }

    @UseGuards(JwtAuthGuard)
    @Post('report/folder/:folderId')
    async createReportByFolder(
        @Param('folderId') folderId: number,
        @Req() req,
        @Body() reportData: Partial<Report>
    ): Promise<Report> {
        console.log('Received report for folderId:', folderId);
        console.log('Requesting userId:', (req.user as { userId: number }).userId);
        console.log('Report data:', reportData);
        
        const reporterUserId = (req.user as { userId: number }).userId;
        return this.reportService.createReportByFolder(folderId, reporterUserId, reportData);
    }
    


}
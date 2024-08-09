import { Controller, Delete, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Notification } from 'src/notif.entity';
import { JwtAuthGuard } from 'src/jwtGuard/jwt-auth.guard';
import { NotificationService } from 'src/service/notification.service';

@Controller('notifications')
export class NotificationController {
    constructor(private notificationService: NotificationService) { }

    @UseGuards(JwtAuthGuard)
    @Get('getNotification')
    async getAllNotifications(
        @Req() req: any

    ): Promise<Notification[]> {
        const userId = (req.user as { userId: number }).userId;
        return await this.notificationService.getAllNotifications(userId);
    }


    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteNotification(
        @Param('id') id: number,
        @Req() req: any
    ): Promise<void> {
        const userId = (req.user as { userId: number }).userId;

        await this.notificationService.deleteUserNotification(userId, id);
    }
    @UseGuards(JwtAuthGuard)
    @Delete('')
    public async deleteAllNotifications(@Req() req: any): Promise<void> {
        const userId = (req.user as { userId: number }).userId;

        try {
            return await this.notificationService.deleteAllUserNotifications(userId);
        } catch (error) {
            console.error('Error deleting all notifications:', error);
            throw new Error('Failed to delete all notifications');
        }
    }


    // @UseGuards(JwtAuthGuard)
    // @Delete(':id')
    // async deleteNotification(
    //     @Param('id') id: number): Promise<void> {
    //     await this.notificationService.deleteNotification(id);
    // }

    // @UseGuards(JwtAuthGuard)
    // @Delete('')
    // public async deleteAllNotifications(@Req() req: Request) {
    //     try {
    //         return await this.notificationService.deleteAllNotifications(); 
    //       } catch (error) {
    //        // throw ErrorHandlerHelper.errorHandler(error, req);
    //       }
    //     }

}

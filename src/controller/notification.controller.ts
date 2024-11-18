import { Body, Controller, Delete, Get, Param, Patch, Put, Req, UseGuards } from '@nestjs/common';
import { Notification } from 'src/notif.entity';
import { JwtAuthGuard } from 'src/jwtGuard/jwt-auth.guard';
import { NotificationService } from 'src/service/notification.service';
import { CustomLogger } from 'src/logger/logger.service';

@Controller('notifications')
export class NotificationController {
    constructor(private notificationService: NotificationService,
    private readonly logger: CustomLogger,

    ) { }

    //get all notif
    @Get('getUserNotification/:id')
    @UseGuards(JwtAuthGuard)
    async getAllUserNotifications(
        @Param('id') id:number,
        @Req() req: any): Promise<Notification[]> {
      const userId = (req.user as { userId: number }).userId;
      return await this.notificationService.getAllUserNotifications(userId);
    }
    
    @Get('admin/OrderNotification')
    @UseGuards(JwtAuthGuard)
    async getOrderNotification(): Promise<Notification[]> {
      return await this.notificationService.getOrderNotification();
    }
    
    //get notif by id
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getUserNotificationById(@Param('id') id: number, @Req() req: any) {
        return this.notificationService.getUserNotificationById(id);
    }

    @Put(':id/read')
    @UseGuards(JwtAuthGuard)
    async markAsRead(@Param('id') id: number): Promise<void> {
        await this.notificationService.markAsRead(id);
    }



    //delete user notif
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async deleteUserNotification(
        @Param('id') id: number,
        @Req() req: any
    ): Promise<void> {
        const userId = (req.user as { userId: number }).userId;

        await this.notificationService.deleteUserNotification(userId, id);
    }

    //delete all notif
    @Delete('')
    @UseGuards(JwtAuthGuard)
    public async deleteAllUserNotifications(@Req() req: any): Promise<void> {
        const userId = (req.user as { userId: number }).userId;

        try {
            return await this.notificationService.deleteAllUserNotifications(userId);
        } catch (error) {
           this.logger.error('Error deleting all notifications:', error);
            throw new Error('Failed to delete all notifications');
        }
    }

}

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
    @UseGuards(JwtAuthGuard)
    @Get('getUserNotification/:id')
    async getAllUserNotifications(
        @Param('id') id:number,
        @Req() req: any): Promise<Notification[]> {
      const userId = (req.user as { userId: number }).userId;
      return await this.notificationService.getAllUserNotifications(userId);
    }
    
    @UseGuards(JwtAuthGuard)
    @Get('admin/OrderNotification')
    async getOrderNotification(): Promise<Notification[]> {
      return await this.notificationService.getOrderNotification();
    }
    
    //get notif by id
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getUserNotificationById(@Param('id') id: number, @Req() req: any) {
        return this.notificationService.getUserNotificationById(id); // Fetch by notification ID
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id/read')
    async markAsRead(@Param('id') id: number): Promise<void> {
        await this.notificationService.markAsRead(id);
    }



    //delete user notif
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteUserNotification(
        @Param('id') id: number,
        @Req() req: any
    ): Promise<void> {
        const userId = (req.user as { userId: number }).userId;

        await this.notificationService.deleteUserNotification(userId, id);
    }

    //delete all notif
    @UseGuards(JwtAuthGuard)
    @Delete('')
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

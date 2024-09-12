import { Body, Controller, Delete, Get, Param, Patch, Put, Req, UseGuards } from '@nestjs/common';
import { Notification } from 'src/notif.entity';
import { JwtAuthGuard } from 'src/jwtGuard/jwt-auth.guard';
import { NotificationService } from 'src/service/notification.service';

@Controller('notifications')
export class NotificationController {
    constructor(private notificationService: NotificationService) { }

    //get all notif
    @UseGuards(JwtAuthGuard)
    @Get('getUserNotification')
    async getAllUserNotifications(
        @Req() req: any

    ): Promise<Notification[]> {
        const userId = (req.user as { userId: number }).userId;
        return await this.notificationService.getAllUserNotifications(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('OrderNotification')
    async getOrderNotification(
        @Req() req: any
    ): Promise<Notification[]> {
        const userId = (req.user as { userId: number }).userId;
        return await this.notificationService.getOrderNotification(userId)
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
            console.error('Error deleting all notifications:', error);
            throw new Error('Failed to delete all notifications');
        }
    }

    
    /////////////////////
    //dashboard

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteOrderNotification(
        @Param('id') id: number): Promise<void> {
        await this.notificationService.deleteOrderNotification(id);
    }
    
    // @UseGuards(JwtAuthGuard)
    // @Delete('')
    // public async deleteAllOrderNotifications(@Req() req: Request) {
    //     try {
    //         return await this.notificationService.deleteAllOrderNotifications();
    //     } catch (error) {
    //         // throw ErrorHandlerHelper.errorHandler(error, req);
    //     }
    // }

}

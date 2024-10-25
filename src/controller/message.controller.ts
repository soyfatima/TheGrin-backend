import { Controller, Post, Get, Param, Body, Req, UseGuards, Query } from '@nestjs/common';
import { MessagingService } from 'src/service/message.service';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/jwtGuard/jwt-auth.guard';
import { use } from 'passport';
import { CustomLogger } from 'src/logger/logger.service';

@Controller('messaging')
export class MessagingController {
    constructor(private readonly messagingService: MessagingService,
    private readonly logger: CustomLogger,

    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('send/:id')
    async sendMessage(
        @Param('id') id: number,
        @Body()
        body:
            { recipientId: number; content: string },
        @Req() req: Request) {
        const userId = (req.user as { userId: number }).userId;
        return this.messagingService.sendMessage(userId, body.recipientId, body.content);

    }

    @UseGuards(JwtAuthGuard)
    @Get('conversation/:id')
    async getMessages(
      @Param('id') recipientId: number, 
      @Req() req: Request                       
    ) {
      const userId = (req.user as { userId: number }).userId;
      const messages = await this.messagingService.getMessages(userId, recipientId);
      return { messages };
    }

  @UseGuards(JwtAuthGuard)
  @Get('senders')
  async getSenders(@Query('id') id: number,
  @Req() req: Request                      
) {
    const userId = (req.user as { userId: number }).userId;
    return this.messagingService.getSenders(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('markAsRead')
  async markMessagesAsRead(@Body() body: { userId: number; recipientId: number }): Promise<void> {
    const { userId, recipientId } = body;
    await this.messagingService.markMessagesAsRead(userId, recipientId);
  }
}

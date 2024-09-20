import { Controller, Post, Get, Param, Body, Req, UseGuards, Query } from '@nestjs/common';
import { MessagingService } from 'src/service/message.service';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/jwtGuard/jwt-auth.guard';
import { use } from 'passport';

@Controller('messaging')
export class MessagingController {
    constructor(private readonly messagingService: MessagingService) { }

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



    // @UseGuards(JwtAuthGuard)
    // @Get('conversation/:recipientId')
    // async getMessages(
    //     @Param('recipientId') recipientId: number,
    //     @Req() req: Request) {
    //     const userId = (req.user as { userId: number }).userId;
    //      console.log('get Sender ID:', userId);
    //     console.log('get Recipient ID:', recipientId);
    //     return this.messagingService.getMessages(userId, recipientId);
    // }


    @UseGuards(JwtAuthGuard)
    @Get('conversation/:id')
    async getMessages(
      @Param('id') recipientId: number, 
      @Req() req: Request                       
    ) {
      const userId = (req.user as { userId: number }).userId;
      console.log('user id', userId);
      console.log('recipient id', recipientId);
      
      const messages = await this.messagingService.getMessages(userId, recipientId);
      console.log('Fetched messages:', messages); // 
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
}

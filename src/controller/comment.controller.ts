import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { CommentService } from 'src/service/comment.service';
import { Comment } from 'src/comment.entity';
import { Folder } from 'src/folder.entity';
import { JwtAuthGuard } from 'src/jwtGuard/jwt-auth.guard';

export class CommentDto {
  content: string;
}

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // Add a comment

  @UseGuards(JwtAuthGuard)
  @Post(':folderId')
  async addComment(
    @Param('folderId') folderId: number,
    @Body() body: { content: string },
    @Req() req: any,
  ): Promise<Comment> {
    try {
      const userId = (req.user as { userId: number }).userId;
      const comment = await this.commentService.addComment(
        folderId,
        userId,
        body.content,
      );

      return comment;
    } catch (error) {
      console.error('Error adding comment:', error.message);
      throw new BadRequestException('Failed to add comment');
    }
  }

  //fetch comments
  @Get('/folder/:folderId')
  async getCommentsByFolderId(@Param('folderId') folderId: number) {
    return await this.commentService.getCommentsByFolderId(folderId);
  }

  // Add reply to a comment

  @UseGuards(JwtAuthGuard)
  @Post('reply/:commentId')
  async addReplyToComment(
    @Param('commentId') commentId: number,
    @Body() body: { content: string; replyCreateDate: Date },
    @Req() req: any,
  ): Promise<any> {
    try {
      const userId = req.user.userId;

      // Call your service method to add a reply to the comment
      const reply = await this.commentService.addReplyToComment(
        commentId,
        userId,
        body.content,
        body.replyCreateDate,
      );
      return reply;
    } catch (error) {
      console.error('Error adding reply:', error.message);
      throw new BadRequestException('Failed to add reply');
    }
  }
}

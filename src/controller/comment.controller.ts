import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  ParseIntPipe,
  NotFoundException,
  InternalServerErrorException,
  Put,
  ForbiddenException,
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
    @Body() body: Partial<Comment>,
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
  async getCommentsByFolderId(@Param('folderId') folderId: number): Promise<Comment[]> {
    return await this.commentService.getCommentsByFolderId(folderId);
  }

  // Add reply to a comment
  @UseGuards(JwtAuthGuard)
  @Post(':commentId/reply')
  async addReply(
    @Req() req:any,
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body('content') content: string,
  ): Promise<Comment> {
    const userId = (req.user as { userId: number }).userId;
    return this.commentService.addReply(commentId, content, userId);
  }

  @UseGuards(JwtAuthGuard)
@Put(':id')
async updateComment(
  @Req() req: any,
  @Param('id') id: number,
  @Body('folderId') folderId: number,
  @Body('content') content: string,
) {
  const userId = (req.user as { userId: number }).userId;
  return this.commentService.updateComment(userId, id, folderId, content);
}

@UseGuards(JwtAuthGuard)
@Put('replies/:id')
async updateReply(
  @Req() req: any,
  @Param('id') id: number,
  @Body('folderId') folderId: number,
  @Body('content') content: string,
) {
  const userId = (req.user as { userId: number }).userId;
  return this.commentService.updateReply(userId, id, folderId, content);
}

@Get('user-comment/:id')
async getUserComment(
  @Param('id') id:number):Promise<Comment[]>{
    return this.commentService.getUserComment(id)
  }
}

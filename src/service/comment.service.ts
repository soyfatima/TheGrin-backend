import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from 'src/comment.entity';
import { Folder } from 'src/folder.entity';
import { User } from 'src/user.entity';
@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Folder)
    private folderRepository: Repository<Folder>,
  
  ) {}

 
  async addComment(folderId: number, userId: number, content: string): Promise<Comment> {
    const user = await this.userRepository.findOne({where:{id:userId}});
    const folder = await this.folderRepository.findOne({where:{id:folderId}});

    if (!user || !folder) {
      throw new Error('User or Folder not found');
    }

    const comment = new Comment();
    comment.content = content;
    comment.user = user;
    comment.folder = folder;

    return this.commentRepository.save(comment);
  }


  //fetch comments
  async getCommentsByFolderId(folderId: number): Promise<Comment[]> {
    try {
      const comments = await this.commentRepository.find({
        where: { folder: { id: folderId } },
        relations: ['user', 'replies', 'replies.user'],
        order: { createdAt: 'ASC' }, // Optionally sort comments by creation date
      });
      return comments;
    } catch (error) {
      console.error('Error fetching comments:', error.message);
      throw new Error('Failed to fetch comments');
    }
  }

 

  async addReply(commentId: number, content: string, userId: number): Promise<Comment> {
    const parentComment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!parentComment) {
      throw new NotFoundException('Parent comment not found');
    }
    const reply = this.commentRepository.create({ 
      content, 
      user: { id: userId }, 
      parent: parentComment,
      folder: parentComment.folder  // Ensure the folder is also set correctly
    });
    return this.commentRepository.save(reply);
  }

  
  async updateComment(userId: number, id: number, folderId: number, content: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: id},
      relations: ['user', 'folder', 'parent', 'replies'],
    });
  
    if (!comment) {
      throw new NotFoundException('Comment not found in the specified folder');
    }
  
    if (comment.user.id !== userId) {
      throw new ForbiddenException('You are not allowed to edit this comment');
    }
  
    comment.content = content;
    await this.commentRepository.save(comment);
    return comment;
  }
  

  async updateReply(userId: number, id: number, folderId: number, content: string): Promise<Comment> {
    const reply = await this.commentRepository.findOne({
      where: { id: id },
      relations: ['user', 'folder', 'parent', 'replies'],
    });
  
    if (!reply) {
      throw new NotFoundException('Reply not found in the specified folder');
    }
  
    if (reply.user.id !== userId) {
      throw new ForbiddenException('You are not allowed to edit this reply');
    }
  
    reply.content = content;
    await this.commentRepository.save(reply);
    return reply;
  }
  
}
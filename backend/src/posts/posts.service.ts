import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { paginate, PaginationDto } from '../common/pagination.js';
import { AuthUser } from '../common/role.enum.js';
import { Post } from '../schemas/post.schema.js';
import { CreatePostDto } from './dto/post.dto.js';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<Post>) {}

  async findAll({ page, limit }: PaginationDto) {
    const [posts, total] = await Promise.all([
      this.postModel
        .find()
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name')
        .lean(),
      this.postModel.estimatedDocumentCount(),
    ]);
    return paginate(posts, total, { page, limit });
  }

  create(user: AuthUser, dto: CreatePostDto) {
    return this.postModel.create({ ...dto, author: user.id });
  }

  async remove(user: AuthUser, id: Types.ObjectId) {
    const { deletedCount } = await this.postModel.deleteOne({ _id: id, author: user.id });
    if (!deletedCount) throw new NotFoundException('Post not found');
  }
}

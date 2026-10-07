import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { paginate, PaginationDto } from '../common/pagination.js';
import { AuthUser } from '../common/role.enum.js';
import { Post } from '../schemas/post.schema.js';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto.js';

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

  async findOne(id: Types.ObjectId) {
    const post = await this.postModel.findById(id).populate('author', 'name').lean();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(user: AuthUser, id: Types.ObjectId, dto: UpdatePostDto) {
    const post = await this.postModel
      .findOneAndUpdate({ _id: id, author: user.id }, dto, { returnDocument: 'after' })
      .lean();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async remove(user: AuthUser, id: Types.ObjectId) {
    const { deletedCount } = await this.postModel.deleteOne({ _id: id, author: user.id });
    if (!deletedCount) throw new NotFoundException('Post not found');
  }
}

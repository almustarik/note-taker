import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import { Model, PipelineStage, Types } from 'mongoose';
import { paginate, PaginationDto } from '../common/pagination.js';
import { AuthUser, Role } from '../common/role.enum.js';
import { Note } from '../schemas/note.schema.js';
import { Post } from '../schemas/post.schema.js';
import { User } from '../schemas/user.schema.js';
import { CreateUserDto, InterestsQueryDto, UpdateUserDto } from './dto/user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Note.name) private noteModel: Model<Note>,
    @InjectModel(Post.name) private postModel: Model<Post>,
  ) {}

  async create(dto: CreateUserDto) {
    if (await this.userModel.exists({ email: dto.email })) {
      throw new ConflictException('Email already in use');
    }
    const password = await bcrypt.hash(dto.password, 10);
    return this.userModel.create({ ...dto, password });
  }

  async findAll({ page, limit }: PaginationDto) {
    const [users, total] = await Promise.all([
      this.userModel
        .find()
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.userModel.estimatedDocumentCount(),
    ]);
    return paginate(users, total, { page, limit });
  }

  findById(id: Types.ObjectId | string) {
    return this.userModel.findById(id).lean();
  }

  findByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email }).select('+password').lean();
  }

  async findOne(id: Types.ObjectId) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: Types.ObjectId, dto: UpdateUserDto) {
    if (dto.email && (await this.userModel.exists({ email: dto.email, _id: { $ne: id } }))) {
      throw new ConflictException('Email already in use');
    }
    const changes: Partial<User> = { ...dto };
    if (dto.password) changes.password = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.findByIdAndUpdate(id, changes, { returnDocument: 'after' }).lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // Guard against demoting or deleting the last admin, and wrap cascade in transactions
  async adminUpdate(admin: AuthUser, id: Types.ObjectId, dto: UpdateUserDto) {
    if (id.equals(admin.id) && dto.role && dto.role !== admin.role) {
      throw new BadRequestException('You cannot change your own role');
    }
    if (dto.role && dto.role === Role.User) {
      const target = await this.userModel.findById(id);
      if (target?.role === Role.Admin) {
        const adminCount = await this.userModel.countDocuments({ role: Role.Admin });
        if (adminCount <= 1) {
          throw new BadRequestException('Cannot demote the last remaining admin');
        }
      }
    }
    return this.update(id, dto);
  }

  async remove(admin: AuthUser, id: Types.ObjectId) {
    if (id.equals(admin.id)) throw new BadRequestException('You cannot delete your own account');

    const target = await this.userModel.findById(id);
    if (!target) throw new NotFoundException('User not found');

    if (target.role === Role.Admin) {
      const adminCount = await this.userModel.countDocuments({ role: Role.Admin });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last remaining admin');
      }
    }

    const isReplicaSet = Boolean((this.userModel.db as any).client?.topology?.description?.setName);
    if (isReplicaSet) {
      const session = await this.userModel.db.startSession();
      try {
        await session.withTransaction(async () => {
          await this.userModel.findByIdAndDelete(id, { session });
          await Promise.all([
            this.noteModel.deleteMany({ owner: id }, { session }),
            this.postModel.deleteMany({ author: id }, { session }),
          ]);
        });
      } finally {
        await session.endSession();
      }
    } else {
      await this.userModel.findByIdAndDelete(id);
      await Promise.all([
        this.noteModel.deleteMany({ owner: id }),
        this.postModel.deleteMany({ author: id }),
      ]);
    }
  }

  async groupByInterests({ page, limit, interest }: InterestsQueryDto) {
    const filter = interest?.length ? { $in: interest } : { $type: 'string' };

    const pipeline: PipelineStage[] = [
      { $match: { interests: filter } },
      { $project: { name: 1, interests: 1 } },
      { $unwind: '$interests' },
      { $match: { interests: filter } },
      {
        $group: {
          _id: '$interests',
          count: { $sum: 1 },
          users: { $firstN: { input: { _id: '$_id', name: '$name' }, n: 10 } },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      {
        $facet: {
          data: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            { $project: { _id: 0, interest: '$_id', count: 1, users: 1 } },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [result] = await this.userModel.aggregate(pipeline);
    return paginate(result.data, result.total[0]?.count ?? 0, { page, limit });
  }

  async findPostsByUser(userId: Types.ObjectId, { page, limit }: PaginationDto) {
    const [result] = await this.userModel.aggregate([
      { $match: { _id: userId } },
      {
        $lookup: {
          from: this.postModel.collection.name,
          localField: '_id',
          foreignField: 'author',
          pipeline: [
            { $sort: { _id: -1 } },
            {
              $facet: {
                data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
                total: [{ $count: 'count' }],
              },
            },
          ],
          as: 'posts',
        },
      },
      { $unwind: '$posts' },
      {
        $project: {
          _id: 0,
          author: { _id: '$_id', name: '$name' },
          data: '$posts.data',
          total: { $ifNull: [{ $first: '$posts.total.count' }, 0] },
        },
      },
    ]);

    if (!result) throw new NotFoundException('User not found');
    return { author: result.author, ...paginate(result.data, result.total, { page, limit }) };
  }
}

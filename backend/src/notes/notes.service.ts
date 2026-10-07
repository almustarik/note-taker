import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { paginate } from '../common/pagination.js';
import { AuthUser, Role } from '../common/role.enum.js';
import { Note } from '../schemas/note.schema.js';
import { CreateNoteDto, NotesQueryDto, UpdateNoteDto } from './dto/note.dto.js';

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private noteModel: Model<Note>) {}

  async findAll(user: AuthUser, { page, limit, scope, owner }: NotesQueryDto) {
    const isAdmin = user.role === Role.Admin;
    if ((scope === 'all' || owner) && !isAdmin) {
      throw new ForbiddenException();
    }

    const filter: { owner?: Types.ObjectId } = {};
    if (owner) filter.owner = new Types.ObjectId(owner);
    else if (scope !== 'all') filter.owner = user.id;

    const query = this.noteModel
      .find(filter)
      .sort({ _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    if (isAdmin) query.populate('owner', 'name email');

    const [notes, total] = await Promise.all([
      query.lean(),
      filter.owner ? this.noteModel.countDocuments(filter) : this.noteModel.estimatedDocumentCount(),
    ]);
    return paginate(notes, total, { page, limit });
  }

  create(user: AuthUser, dto: CreateNoteDto) {
    return this.noteModel.create({ ...dto, owner: user.id });
  }

  async findOne(user: AuthUser, id: Types.ObjectId) {
    const filter = user.role === Role.Admin ? { _id: id } : { _id: id, owner: user.id };
    const note = await this.noteModel.findOne(filter).lean();
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async update(user: AuthUser, id: Types.ObjectId, dto: UpdateNoteDto) {
    const note = await this.noteModel
      .findOneAndUpdate({ _id: id, owner: user.id }, dto, { returnDocument: 'after' })
      .lean();
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async remove(user: AuthUser, id: Types.ObjectId) {
    const { deletedCount } = await this.noteModel.deleteOne({ _id: id, owner: user.id });
    if (!deletedCount) throw new NotFoundException('Note not found');
  }
}

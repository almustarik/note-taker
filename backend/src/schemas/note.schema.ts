import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Note {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  content: string;
}

export const NoteSchema = SchemaFactory.createForClass(Note);

// a user's notes, newest first (filter on owner + sort on _id, no in-memory sort)
NoteSchema.index({ owner: 1, _id: -1 });

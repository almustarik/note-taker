import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Role } from '../common/role.enum.js';

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, enum: Role, default: Role.User })
  role: Role;

  @Prop({ type: [String], default: [] })
  interests: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// login lookup + unique emails
UserSchema.index({ email: 1 }, { unique: true });
// first $match of the group-by-interests aggregation
UserSchema.index({ interests: 1 });

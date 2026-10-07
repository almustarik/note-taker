import { Types } from 'mongoose';

export enum Role {
  User = 'user',
  Admin = 'admin',
}

export interface AuthUser {
  id: Types.ObjectId;
  email: string;
  role: Role;
}

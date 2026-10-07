import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { AppModule } from './app.module.js';
import { Role } from './common/role.enum.js';
import { Note } from './schemas/note.schema.js';
import { Post } from './schemas/post.schema.js';
import { User } from './schemas/user.schema.js';

const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
const userModel = app.get<Model<User>>(getModelToken(User.name));
const noteModel = app.get<Model<Note>>(getModelToken(Note.name));
const postModel = app.get<Model<Post>>(getModelToken(Post.name));

const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin12345';

if (!(await userModel.exists({ email: adminEmail }))) {
  await userModel.create({
    name: 'Admin',
    email: adminEmail,
    password: await bcrypt.hash(adminPassword, 10),
    role: Role.Admin,
  });
  console.log(`Admin created: ${adminEmail}`);
}

const demoUsers: [string, string[]][] = [
  ['Alice', ['chess', 'reading', 'hiking']],
  ['Bob', ['chess', 'cooking']],
  ['Carol', ['reading', 'photography']],
  ['Dan', ['hiking', 'photography', 'chess']],
  ['Eve', []],
];

const password = await bcrypt.hash('Password123', 10);
for (const [name, interests] of demoUsers) {
  const email = `${name.toLowerCase()}@example.com`;
  if (await userModel.exists({ email })) continue;

  const user = await userModel.create({ name, email, password, interests });
  await noteModel.create([
    { owner: user._id, title: `${name}'s todo`, content: 'Buy milk' },
    { owner: user._id, title: `${name}'s ideas`, content: 'Learn MongoDB aggregation' },
  ]);
  await postModel.create({ author: user._id, title: `Hello from ${name}`, body: `I like ${interests.join(', ') || 'nothing yet'}` });
}
console.log('Demo users created (password: Password123)');

await app.close();

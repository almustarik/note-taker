import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { AppModule } from './app.module.js';
import { Role } from './common/role.enum.js';
import { Note } from './schemas/note.schema.js';
import { Post } from './schemas/post.schema.js';
import { User } from './schemas/user.schema.js';
import { demoUsers } from './seed-data.js';

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

// Re-running the seed replaces the demo accounts and their content. Other accounts are not touched.
const existing = await userModel.find({ email: { $in: demoUsers.map((u) => u.email) } }, { _id: 1 }).lean();
const existingIds = existing.map((u) => u._id);
await Promise.all([
  noteModel.deleteMany({ owner: { $in: existingIds } }),
  postModel.deleteMany({ author: { $in: existingIds } }),
  userModel.deleteMany({ _id: { $in: existingIds } }),
]);

// _id carries the creation time, so lists sorted by _id match the createdAt dates
function stamp(daysAgo: number) {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const _id = new Types.ObjectId(Types.ObjectId.generate(Math.floor(date.getTime() / 1000)));
  return { _id, createdAt: date, updatedAt: date };
}

const password = await bcrypt.hash('Password123', 10);
const users = [];
const notes = [];
const posts = [];

for (const demo of demoUsers) {
  const user = { ...stamp(demo.joinedDaysAgo), name: demo.name, email: demo.email, password, role: Role.User, interests: demo.interests };
  users.push(user);
  for (const n of demo.notes) notes.push({ ...stamp(n.daysAgo), owner: user._id, title: n.title, content: n.text });
  for (const p of demo.posts) posts.push({ ...stamp(p.daysAgo), author: user._id, title: p.title, body: p.text });
}

// raw inserts so the backdated timestamps are kept as they are
await userModel.collection.insertMany(users);
await noteModel.collection.insertMany(notes);
await postModel.collection.insertMany(posts);

console.log(`Seeded ${users.length} demo users, ${notes.length} notes and ${posts.length} posts (password: Password123)`);

await app.close();

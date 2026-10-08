import type { INestApplication } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import type { Connection, Model } from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '../src/common/role.enum.js';
import type { User } from '../src/schemas/user.schema.js';

let app: INestApplication;
let mongod: MongoMemoryServer;
let connection: Connection;
let http: () => ReturnType<typeof request>;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function register(name: string, interests: string[] = []) {
  const email = `${name.toLowerCase()}@test.io`;
  const res = await http().post('/api/auth/register').send({ name, email, password: 'Password123', interests }).expect(201);
  return { id: res.body.user._id as string, token: res.body.token as string };
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  // ConfigModule reads the environment when AppModule is imported, so set it first
  process.env.MONGODB_URI = mongod.getUri('notes');
  process.env.JWT_SECRET = 'test-secret';
  const { AppModule } = await import('../src/app.module.js');
  const { configureApp } = await import('../src/setup.js');

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = configureApp(moduleRef.createNestApplication({ logger: false }));
  await app.init();
  http = () => request(app.getHttpServer());

  connection = app.get(getConnectionToken());
  await Promise.all(Object.values(connection.models).map((m) => m.init()));
});

afterAll(async () => {
  await app?.close();
  await mongod?.stop();
});

describe('auth', () => {
  it('hashes passwords and never returns the hash', async () => {
    const res = await http()
      .post('/api/auth/register')
      .send({ name: 'Hash', email: 'Hash@Test.io', password: 'Password123' })
      .expect(201);
    expect(res.body.user.email).toBe('hash@test.io');
    expect(res.body.user).not.toHaveProperty('password');

    const login = await http().post('/api/auth/login').send({ email: 'hash@test.io', password: 'Password123' }).expect(200);
    expect(login.body.user).not.toHaveProperty('password');

    const stored = await connection.collection('users').findOne({ email: 'hash@test.io' });
    expect(stored?.password).toMatch(/^\$2[aby]\$12\$/);
  });

  it('rejects bad credentials, weak passwords, role escalation and operator injection', async () => {
    await http().post('/api/auth/login').send({ email: 'hash@test.io', password: 'wrong-pass1' }).expect(401);
    await http().post('/api/auth/register').send({ name: 'W', email: 'w@test.io', password: 'onlyletters' }).expect(400);
    await http()
      .post('/api/auth/register')
      .send({ name: 'M', email: 'm@test.io', password: 'Password123', role: 'admin' })
      .expect(400);
    await http().post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } }).expect(400);
    await http().get('/api/notes').expect(401);
  });
});

describe('notes and roles', () => {
  let alice: { id: string; token: string };
  let bob: { id: string; token: string };
  let admin: { id: string; token: string };

  beforeAll(async () => {
    alice = await register('Alice', ['chess', 'reading']);
    bob = await register('Bob', ['chess']);

    const users = app.get<Model<User>>(getModelToken('User'));
    const created = await users.create({
      name: 'Admin',
      email: 'admin@test.io',
      password: await bcrypt.hash('Password123', 4),
      role: Role.Admin,
    });
    const login = await http().post('/api/auth/login').send({ email: 'admin@test.io', password: 'Password123' }).expect(200);
    admin = { id: created._id.toString(), token: login.body.token };
  });

  it('lets a user manage only their own notes, newest first and paginated', async () => {
    for (const title of ['first', 'second', 'third']) {
      await http().post('/api/notes').set(auth(alice.token)).send({ title }).expect(201);
    }
    const page = await http().get('/api/notes?limit=2').set(auth(alice.token)).expect(200);
    expect(page.body.data.map((n: { title: string }) => n.title)).toEqual(['third', 'second']);
    expect(page.body.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    await http().get('/api/notes?limit=101').set(auth(alice.token)).expect(400);

    const noteId = page.body.data[0]._id;
    await http().get(`/api/notes/${noteId}`).set(auth(bob.token)).expect(404);
    await http().patch(`/api/notes/${noteId}`).set(auth(bob.token)).send({ title: 'x' }).expect(404);
    await http().delete(`/api/notes/${noteId}`).set(auth(bob.token)).expect(404);
    await http().patch(`/api/notes/${noteId}`).set(auth(alice.token)).send({ title: 'edited' }).expect(200);
    await http().delete(`/api/notes/${noteId}`).set(auth(alice.token)).expect(204);
  });

  it("lets an admin view everyone's notes but not edit them", async () => {
    await http().get('/api/notes?scope=all').set(auth(bob.token)).expect(403);
    const all = await http().get('/api/notes?scope=all').set(auth(admin.token)).expect(200);
    expect(all.body.pagination.total).toBe(2);
    expect(all.body.data[0].owner.name).toBe('Alice');

    const noteId = all.body.data[0]._id;
    await http().get(`/api/notes/${noteId}`).set(auth(admin.token)).expect(200);
    await http().patch(`/api/notes/${noteId}`).set(auth(admin.token)).send({ title: 'x' }).expect(404);
  });

  it('restricts user management to admins and cascades deletes', async () => {
    await http().get('/api/users').set(auth(bob.token)).expect(403);
    const list = await http().get('/api/users?limit=2').set(auth(admin.token)).expect(200);
    expect(list.body.pagination.totalPages).toBeGreaterThan(1);

    const carol = await http()
      .post('/api/users')
      .set(auth(admin.token))
      .send({ name: 'Carol', email: 'carol@test.io', password: 'Password123' })
      .expect(201);
    await http().patch(`/api/users/${carol.body._id}`).set(auth(admin.token)).send({ role: 'admin' }).expect(200);
    await http().patch(`/api/users/${admin.id}`).set(auth(admin.token)).send({ role: 'user' }).expect(400);
    await http().delete(`/api/users/${admin.id}`).set(auth(admin.token)).expect(400);

    await http().post('/api/posts').set(auth(bob.token)).send({ title: 'bye', body: 'b' }).expect(201);
    await http().delete(`/api/users/${bob.id}`).set(auth(admin.token)).expect(204);
    expect(await connection.collection('posts').countDocuments({ title: 'bye' })).toBe(0);
    await http().get('/api/notes').set(auth(bob.token)).expect(401);
  });
});

describe('aggregations', () => {
  it('groups users by interest with exactly one aggregate command', async () => {
    const dan = await register('Dan', ['chess', 'hiking']);
    const db = connection.db!;
    await db.command({ profile: 2 });
    const since = new Date();
    const res = await http().get('/api/users/interests').set(auth(dan.token)).expect(200);
    await db.command({ profile: 0 });

    expect(res.body.data.map((g: { interest: string; count: number }) => [g.interest, g.count])).toEqual([
      ['chess', 2],
      ['hiking', 1],
      ['reading', 1],
    ]);
    const ops = await db
      .collection('system.profile')
      .find({ ns: 'notes.users', ts: { $gte: since } })
      .toArray();
    // one find is the auth guard loading the current user; the view itself is a single aggregate
    expect(ops.map((op) => (op.command?.aggregate ? 'aggregate' : op.op))).toEqual(['query', 'aggregate']);
  });

  it("returns a user's posts with a single $lookup pipeline", async () => {
    const erin = await register('Erin');
    for (const title of ['one', 'two', 'three']) {
      await http().post('/api/posts').set(auth(erin.token)).send({ title, body: 'b' }).expect(201);
    }
    const res = await http().get(`/api/users/${erin.id}/posts?limit=2`).set(auth(erin.token)).expect(200);
    expect(res.body.author.name).toBe('Erin');
    expect(res.body.data.map((p: { title: string }) => p.title)).toEqual(['three', 'two']);
    expect(res.body.pagination.total).toBe(3);
    await http().get('/api/users/000000000000000000000000/posts').set(auth(erin.token)).expect(404);
  });
});

describe('indexes', () => {
  it('creates only the indexes the queries need', async () => {
    const names = async (name: string) => (await connection.collection(name).indexes()).map((i) => i.name).sort();
    expect(await names('users')).toEqual(['_id_', 'email_1', 'interests_1']);
    expect(await names('notes')).toEqual(['_id_', 'owner_1__id_-1']);
    expect(await names('posts')).toEqual(['_id_', 'author_1__id_-1']);
  });

  it('serves the main list queries from those indexes without scanning or sorting in memory', async () => {
    const db = connection.db!;
    const user = await db.collection('users').findOne({ email: 'alice@test.io' });
    const plans = {
      owner_1__id_: await db.collection('notes').find({ owner: user!._id }).sort({ _id: -1 }).limit(20).explain(),
      author_1__id_: await db.collection('posts').find({ author: user!._id }).sort({ _id: -1 }).explain(),
      interests_1: await db
        .collection('users')
        .aggregate([{ $match: { interests: { $in: ['chess'] } } }, { $group: { _id: null, n: { $sum: 1 } } }])
        .explain(),
    };
    for (const [index, plan] of Object.entries(plans)) {
      const text = JSON.stringify(plan);
      expect(text).toContain(index);
      expect(text).not.toContain('COLLSCAN');
      expect(text).not.toContain('"stage":"SORT"');
    }
  });
});

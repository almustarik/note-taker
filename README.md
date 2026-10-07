# Notes

A note-taking app with secure authentication and role-based access.

```
backend/    REST API: NestJS, MongoDB (Mongoose), JWT
frontend/   React + Vite client
```

## Running it

Start MongoDB:

```bash
docker compose up -d        # MongoDB on localhost:27017
```

Backend (http://localhost:3000/api):

```bash
cd backend
cp .env.example .env        # set JWT_SECRET
npm install
npm run build
npm run seed                # admin@example.com / Admin12345 + a few demo users (password: Password123)
npm start
```

Frontend (http://localhost:5173):

```bash
cd frontend
cp .env.example .env        # VITE_API_URL, defaults to http://localhost:3000/api
npm install
npm run dev
```

The backend allows requests from `FRONTEND_URL` (CORS), which defaults to `http://localhost:5173`.

## Roles

- **user**: create, update, delete and list their own notes.
- **admin**: everything a user can do, plus manage users (add, list, update, remove) and view everyone's notes.

When an admin removes a user, that user's notes and posts are removed too. An admin can't delete their own account or change their own role, so there is always at least one admin.

## Endpoints

All routes are under `/api` and need a `Bearer` token, except register and login (those two are rate limited to 15 requests a minute). List endpoints accept `?page=&limit=` (max 100).

| Method | Path | Access |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | public |
| GET / PATCH | `/auth/me` | logged in |
| GET / POST | `/notes` | logged in (`?scope=all`: admin only) |
| GET / PATCH / DELETE | `/notes/:id` | owner (admins can also GET) |
| GET / POST | `/posts` | logged in |
| DELETE | `/posts/:id` | author |
| GET | `/users/interests?interest=chess,reading` | logged in |
| GET | `/users/:id/posts` | logged in |
| GET / POST | `/users` | admin |
| GET / PATCH / DELETE | `/users/:id` | admin |

## Indexes

All indexes are defined with `schema.index()` in `backend/src/schemas`.

| Collection | Index | Used by |
| --- | --- | --- |
| users | `{ email: 1 }` unique | login, unique emails |
| users | `{ interests: 1 }` | `$match` at the start of the interests aggregation |
| notes | `{ owner: 1, _id: -1 }` | listing a user's notes newest first, plus its count |
| posts | `{ author: 1, _id: -1 }` | the `$lookup` from users to posts, sorted newest first |

Everything else uses the default `_id` index: get by id, the admin lists, the post feed, and loading the user in the auth guard.

I sort by `_id` instead of `createdAt` because ObjectIds already increase over time, so I don't need an extra index on `createdAt`. Unfiltered lists get their total from `estimatedDocumentCount()`, which reads collection metadata instead of scanning.

I checked every query with `explain()`. None of them do a collection scan or an in-memory sort.

## Aggregations

Both are in `backend/src/users/users.service.ts`.

**Users grouped by interests** (`GET /users/interests`) is a single `aggregate()` call. The steps are `$match` → `$unwind` → `$group` → `$sort`, followed by a `$facet` that returns the page and the total count together, so no second query is needed. The first `$match` either filters by `$in` (when `?interest=` is passed) or by `$type: 'string'`, so it can use the `interests` index. Each group returns at most 10 users (`$firstN`), and `count` holds the real total.

**Posts of a user** (`GET /users/:id/posts`) is one pipeline on `users`. It does a `$match` on `_id`, then a `$lookup` into `posts` on `author` with a sort and a `$facet` for pagination. Starting from users means one query can tell an unknown user (404) apart from a user with no posts (empty list).

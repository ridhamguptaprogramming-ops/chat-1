# Realtime Chat Starter

Production-oriented starter for a WhatsApp-style chat system with:

- React 19 + Vite frontend
- Node.js + Express + Socket.IO backend
- PostgreSQL + Prisma data model
- Redis-ready Socket.IO scaling
- S3 presigned uploads for private media storage
- JWT auth with email/phone credentials and OAuth extension points

## Why This Stack

For a production chat app, I recommend **Node.js + Socket.IO + PostgreSQL + Redis + S3**.

- **Node.js** fits realtime I/O-heavy workloads well and keeps REST + WebSocket code in one language.
- **Socket.IO** gives reconnects, rooms, acknowledgements, and fallback behavior beyond raw WebSockets.
- **PostgreSQL** is excellent for durable chat metadata, membership, message ordering, indexing, and transactional status updates.
- **Redis** provides horizontal WebSocket fan-out, presence TTLs, typing TTLs, and queue coordination.
- **S3** keeps large media out of the app server and database using presigned upload/download URLs.

Firebase is faster for prototypes, but for WhatsApp-level thinking you usually want deeper control over delivery, storage layout, encryption, queues, observability, data residency, and cost.

## Folder Structure

```text
apps/
  api/        Express + Socket.IO backend
  web/        React chat UI
docs/
  architecture.md
```

## Local Development

```bash
cd apps/api
cp .env.example .env
npm install
npm run prisma:generate
npm run dev
```

In another terminal:

```bash
cd apps/web
npm install
npm run dev
```

For a real database:

```bash
cd apps/api
npm run prisma:migrate
```

## Core Production Flows

1. User signs up or logs in and receives a JWT.
2. Frontend connects to Socket.IO with the JWT.
3. Server joins the user to personal and chat rooms.
4. Messages are persisted first, then emitted to the chat room.
5. Delivery/read states are stored per recipient in `MessageReceipt`.
6. Media is uploaded directly from client to S3 via presigned URLs, then attached to a message.
7. Push notification workers fan out missed messages to offline users.

## Sources Checked

- React docs list the current docs as covering the latest React version, with React 19.2 shown as latest at time checked: https://react.dev/versions
- Socket.IO supports Redis adapters for multi-server broadcasting: https://socket.io/docs/v4/redis-adapter/
- Prisma documents PostgreSQL setup and Prisma Client generation: https://docs.prisma.io/docs/prisma-orm/quickstart/postgresql
- AWS S3 presigned URLs allow temporary upload access without exposing AWS credentials: https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html

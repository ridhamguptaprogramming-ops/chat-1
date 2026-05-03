# Architecture

## Product Scope

Core features:

- Email/phone login, with OAuth-ready provider fields
- One-to-one chats and groups
- Realtime message delivery
- Sent, delivered, and read receipts
- Typing indicators
- Presence
- Media sharing through S3
- Push notification outbox

## High-Level Design

```text
Mobile/Web Client
  | REST: auth, chat history, uploads
  | WebSocket: messages, receipts, typing, presence
API Gateway / Load Balancer
  |
Node.js Chat API instances
  |        |
Postgres  Redis
  |        |
S3      Queue Workers
           |
        APNs/FCM/Web Push
```

## Database Strategy

Use PostgreSQL as the source of truth:

- `User`: identity and auth profile
- `Chat`: direct or group conversation
- `ChatMember`: membership, roles, per-chat read cursor
- `Message`: immutable message envelope
- `MessageReceipt`: per-user delivery/read state
- `Attachment`: media metadata and storage key
- `Device`: push tokens

Use Redis for volatile state:

- `presence:user:{id}` with short TTL
- `typing:chat:{chatId}:user:{userId}` with short TTL
- Socket.IO Redis adapter for cross-node room broadcasts
- Optional streams/queues for push notifications and analytics

## Message Delivery Semantics

The starter implements a practical baseline:

1. Client emits `message:send`.
2. Server checks membership.
3. Server writes `Message` and recipient `MessageReceipt` rows in a transaction.
4. Server emits `message:new` to `chat:{chatId}`.
5. Connected recipient clients emit `message:delivered`.
6. Recipient opens chat and emits `message:read`.

At very large scale, add a message broker:

- API writes message to Postgres and publishes `message.created`.
- Delivery worker fans out to connected regions and queues push notifications.
- Receipt worker batches receipt updates.

## High Concurrency

- Keep WebSocket servers stateless except active socket maps.
- Use sticky sessions at the load balancer when required by the deployment target.
- Use Socket.IO Redis adapter for cross-instance broadcasts.
- Use database connection pooling through PgBouncer or managed poolers.
- Paginate history with cursor pagination by `(createdAt, id)`.
- Store large media in object storage, never in Postgres.
- Batch receipt updates and push notifications.

## Horizontal Scaling

Start as a modular monolith:

- `auth`
- `chats`
- `messages`
- `realtime`
- `media`
- `notifications`

Split into services when operational pressure proves it:

- Auth/identity service
- Chat metadata service
- Message write service
- Realtime gateway service
- Notification service
- Media service

For early production, a modular monolith is usually better because transactions, migrations, debugging, and release flow remain simpler. Microservices become worthwhile when teams, traffic, deployment cadence, or data ownership require independent scaling.

## Security

Authentication:

- Use short-lived JWT access tokens and refresh tokens.
- Store password hashes with bcrypt or argon2.
- Add OAuth providers using a stable library such as Passport or Auth.js.
- Protect every chat/message operation with membership checks.

End-to-end encryption basics:

- Each device has an identity key pair and signed pre-key.
- Sender encrypts a message key for every recipient device.
- Server stores only ciphertext and routing metadata.
- For groups, use sender keys or a group ratchet design.
- Never let the server generate or persist plaintext message bodies in an E2EE mode.

Privacy:

- Encrypt data at rest.
- Keep object storage private.
- Use presigned URLs with short TTLs.
- Minimize logs containing phone numbers, emails, message text, or object keys.
- Add retention and account deletion workflows.

## UI/UX

Mobile-first layout:

- Left chat list on desktop, collapsible list on mobile.
- Message bubbles grouped by sender and time.
- Clear timestamps and receipt indicators.
- Composer supports text and attachment actions.
- Typing indicator appears near composer, not as a blocking banner.
- Empty states should guide the user to start or select a chat without feeling like a marketing page.

## Deployment

Recommended production baseline:

- Frontend: Vercel, Netlify, or CloudFront/S3
- Backend: AWS ECS/Fargate, Fly.io, Render, Railway, or Kubernetes
- Database: AWS RDS PostgreSQL, Neon, Supabase, or Crunchy Bridge
- Redis: AWS ElastiCache, Upstash, or Redis Cloud
- Media: AWS S3 + CloudFront
- Push: FCM for Android/Web, APNs for iOS

CI/CD:

- Run lint, typecheck, tests, Prisma migration validation.
- Build Docker image for API.
- Deploy frontend on every main branch merge.
- Run migrations as a controlled release step.
- Use preview environments for pull requests.

## Scaling To Millions

- Partition message storage by chat id or time window once single Postgres limits are near.
- Move hot message fan-out to Kafka, Redpanda, NATS JetStream, or SQS/SNS depending on ordering needs.
- Use regional realtime gateways and route users to nearest region.
- Use a global user/device directory for routing.
- Store media in regional buckets with CDN.
- Add abuse detection, rate limiting, spam scoring, and device trust.
- Build observability around socket connection count, emit latency, queue lag, DB p95, failed deliveries, and push notification success.

## Trade-Offs

- Firebase: fastest MVP, less infrastructure, harder to customize advanced delivery, migrations, E2EE, and cost controls.
- Django Channels: great if your team is Python-heavy, but Node has a larger realtime ecosystem.
- Flutter: best for native-quality mobile from one codebase; React is faster for web-first teams.
- MongoDB/Cassandra/DynamoDB: good for huge append-heavy message streams, but SQL is easier for product correctness until scale demands partitioned NoSQL.

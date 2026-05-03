import type { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { z } from "zod";
import { prisma } from "./db.js";
import { verifyAccessToken, type AuthUser } from "./auth.js";
import { config } from "./config.js";

type SocketData = {
  user: AuthUser;
};

const sendMessageSchema = z.object({
  chatId: z.string().uuid(),
  body: z.string().max(5000).optional(),
  kind: z.enum(["TEXT", "IMAGE", "VIDEO", "FILE"]).default("TEXT"),
  attachmentIds: z.array(z.string().uuid()).default([]),
  clientId: z.string().max(120).optional(),
  ciphertext: z.string().optional()
}).refine((value) => value.body || value.ciphertext || value.attachmentIds.length > 0, "message content required");

export async function configureRealtime(io: Server) {
  if (config.REDIS_URL) {
    const pub = new Redis(config.REDIS_URL);
    const sub = pub.duplicate();
    io.adapter(createAdapter(pub, sub));
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (typeof token !== "string") throw new Error("missing token");
      (socket.data as SocketData).user = await verifyAccessToken(token);
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const user = (socket.data as SocketData).user;
    socket.join(`user:${user.id}`);

    const memberships = await prisma.chatMember.findMany({ where: { userId: user.id } });
    memberships.forEach((membership) => socket.join(`chat:${membership.chatId}`));
    io.emit("presence:update", { userId: user.id, status: "online" });

    socket.on("chat:join", async ({ chatId }: { chatId: string }, ack?: Ack) => {
      const member = await prisma.chatMember.findUnique({ where: { chatId_userId: { chatId, userId: user.id } } });
      if (!member) return ack?.({ ok: false, error: "not a chat member" });
      socket.join(`chat:${chatId}`);
      ack?.({ ok: true });
    });

    socket.on("typing:start", async ({ chatId }: { chatId: string }) => {
      if (await isMember(chatId, user.id)) {
        socket.to(`chat:${chatId}`).emit("typing:update", { chatId, userId: user.id, isTyping: true });
      }
    });

    socket.on("typing:stop", async ({ chatId }: { chatId: string }) => {
      if (await isMember(chatId, user.id)) {
        socket.to(`chat:${chatId}`).emit("typing:update", { chatId, userId: user.id, isTyping: false });
      }
    });

    socket.on("message:send", async (payload, ack?: Ack) => {
      try {
        const input = sendMessageSchema.parse(payload);
        const member = await prisma.chatMember.findUnique({
          where: { chatId_userId: { chatId: input.chatId, userId: user.id } },
          include: { chat: { include: { members: true } } }
        });
        if (!member) return ack?.({ ok: false, error: "not a chat member" });

        const message = await prisma.$transaction(async (tx) => {
          const created = await tx.message.create({
            data: {
              chatId: input.chatId,
              senderId: user.id,
              kind: input.kind,
              body: input.body,
              ciphertext: input.ciphertext,
              clientId: input.clientId,
              attachments: input.attachmentIds.length
                ? { connect: input.attachmentIds.map((id) => ({ id })) }
                : undefined
            },
            include: { sender: { select: { id: true, displayName: true, avatarUrl: true } }, attachments: true, receipts: true }
          });

          await tx.messageReceipt.createMany({
            data: member.chat.members
              .filter((chatMember) => chatMember.userId !== user.id)
              .map((chatMember) => ({ messageId: created.id, userId: chatMember.userId, status: "SENT" })),
            skipDuplicates: true
          });
          await tx.chat.update({ where: { id: input.chatId }, data: { updatedAt: new Date() } });
          return created;
        });

        io.to(`chat:${input.chatId}`).emit("message:new", { message });
        ack?.({ ok: true, message });
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : "send failed" });
      }
    });

    socket.on("message:delivered", async ({ messageId }: { messageId: string }, ack?: Ack) => {
      await prisma.messageReceipt.updateMany({
        where: { messageId, userId: user.id, status: "SENT" },
        data: { status: "DELIVERED", deliveredAt: new Date() }
      });
      io.to(`user:${user.id}`).emit("receipt:update", { messageId, userId: user.id, status: "DELIVERED" });
      ack?.({ ok: true });
    });

    socket.on("message:read", async ({ chatId, messageId }: { chatId: string; messageId: string }, ack?: Ack) => {
      if (!(await isMember(chatId, user.id))) return ack?.({ ok: false, error: "not a chat member" });
      const now = new Date();
      await prisma.$transaction([
        prisma.messageReceipt.updateMany({
          where: { messageId, userId: user.id },
          data: { status: "READ", deliveredAt: now, readAt: now }
        }),
        prisma.chatMember.update({
          where: { chatId_userId: { chatId, userId: user.id } },
          data: { lastReadAt: now }
        })
      ]);
      io.to(`chat:${chatId}`).emit("receipt:update", { messageId, userId: user.id, status: "READ" });
      ack?.({ ok: true });
    });

    socket.on("disconnect", async () => {
      const sockets = await io.in(`user:${user.id}`).fetchSockets();
      if (sockets.length === 0) {
        io.emit("presence:update", { userId: user.id, status: "offline" });
      }
    });
  });
}

type Ack = (response: { ok: boolean; error?: string; message?: unknown }) => void;

async function isMember(chatId: string, userId: string) {
  return Boolean(await prisma.chatMember.findUnique({ where: { chatId_userId: { chatId, userId } } }));
}

import { Router } from "express";
import { z } from "zod";
import { signup, login, requireAuth, startGoogleLogin, googleCallback } from "./auth.js";
import { prisma } from "./db.js";
import { createUploadUrl } from "./storage.js";

export const routes = Router();

routes.post("/auth/signup", signup);
routes.post("/auth/login", login);
routes.get("/auth/google", startGoogleLogin);
routes.get("/auth/google/callback", googleCallback);

routes.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

routes.get("/chats", requireAuth, async (req, res) => {
  const memberships = await prisma.chatMember.findMany({
    where: { userId: req.user!.id },
    orderBy: { chat: { updatedAt: "desc" } },
    include: {
      chat: {
        include: {
          members: { include: { user: { select: { id: true, displayName: true, avatarUrl: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 }
        }
      }
    }
  });
  res.json({ chats: memberships.map((membership) => membership.chat) });
});

const createChatSchema = z.object({
  type: z.enum(["DIRECT", "GROUP"]),
  title: z.string().min(1).max(120).optional(),
  memberIds: z.array(z.string().uuid()).min(1)
});

routes.post("/chats", requireAuth, async (req, res) => {
  const input = createChatSchema.parse(req.body);
  const uniqueMemberIds = [...new Set([req.user!.id, ...input.memberIds])];

  if (input.type === "DIRECT" && uniqueMemberIds.length !== 2) {
    return res.status(400).json({ error: "direct chats require exactly two members" });
  }

  const chat = await prisma.chat.create({
    data: {
      type: input.type,
      title: input.type === "GROUP" ? input.title : undefined,
      createdById: req.user!.id,
      members: {
        create: uniqueMemberIds.map((userId) => ({
          userId,
          role: userId === req.user!.id ? "OWNER" : "MEMBER"
        }))
      }
    },
    include: { members: true }
  });

  res.status(201).json({ chat });
});

routes.get("/chats/:chatId/messages", requireAuth, async (req, res) => {
  const chatId = String(req.params.chatId);
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const limit = Math.min(Number(req.query.limit ?? 30), 100);

  const membership = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId: req.user!.id } }
  });
  if (!membership) return res.status(403).json({ error: "not a chat member" });

  const messages = await prisma.message.findMany({
    where: { chatId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      sender: { select: { id: true, displayName: true, avatarUrl: true } },
      attachments: true,
      receipts: true
    }
  });

  res.json({ messages: messages.reverse(), nextCursor: messages.at(-1)?.id });
});

const uploadSchema = z.object({
  fileName: z.string().min(1).max(180),
  mimeType: z.string().min(3).max(120),
  byteSize: z.number().int().positive().max(50 * 1024 * 1024)
});

routes.post("/media/presign", requireAuth, async (req, res) => {
  const input = uploadSchema.parse(req.body);
  const upload = await createUploadUrl(req.user!.id, input);
  const attachment = await prisma.attachment.create({
    data: {
      uploaderId: req.user!.id,
      storageKey: upload.key,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      fileName: input.fileName
    }
  });

  res.status(201).json({ attachment, uploadUrl: upload.uploadUrl });
});

routes.post("/devices", requireAuth, async (req, res) => {
  const input = z.object({
    platform: z.enum(["ios", "android", "web"]),
    pushToken: z.string().min(10)
  }).parse(req.body);

  const device = await prisma.device.upsert({
    where: { platform_pushToken: input },
    create: { ...input, userId: req.user!.id },
    update: { userId: req.user!.id }
  });

  res.status(201).json({ device });
});

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "./db.js";
import { config } from "./config.js";

export type AuthUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
  displayName: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const signupSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  displayName: z.string().min(1).max(80),
  password: z.string().min(8)
}).refine((value) => value.email || value.phone, "email or phone is required");

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  password: z.string().min(8)
}).refine((value) => value.email || value.phone, "email or phone is required");

export function signAccessToken(user: AuthUser) {
  return jwt.sign(
    { sub: user.id, email: user.email, phone: user.phone, displayName: user.displayName },
    config.JWT_SECRET,
    { expiresIn: "15m", issuer: "chat-api" }
  );
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) return res.status(401).json({ error: "missing token" });

    req.user = await verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

export async function verifyAccessToken(token: string): Promise<AuthUser> {
  const payload = jwt.verify(token, config.JWT_SECRET, { issuer: "chat-api" });
  if (typeof payload !== "object" || !payload.sub) {
    throw new Error("invalid token payload");
  }

  const user = await prisma.user.findUnique({
    where: { id: String(payload.sub) },
    select: { id: true, email: true, phone: true, displayName: true }
  });
  if (!user) throw new Error("user not found");
  return user;
}

export async function signup(req: Request, res: Response) {
  const input = signupSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      phone: input.phone,
      displayName: input.displayName,
      passwordHash
    },
    select: { id: true, email: true, phone: true, displayName: true }
  });

  res.status(201).json({ user, accessToken: signAccessToken(user) });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const user = await prisma.user.findFirst({
    where: input.email ? { email: input.email } : { phone: input.phone }
  });

  if (!user?.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  const authUser = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    displayName: user.displayName
  };

  res.json({ user: authUser, accessToken: signAccessToken(authUser) });
}

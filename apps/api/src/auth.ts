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

export function startGoogleLogin(_req: Request, res: Response) {
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_OAUTH_REDIRECT_URI) {
    return res.redirect(`${config.WEB_ORIGIN}?authError=google_not_configured`);
  }

  const params = new URLSearchParams({
    client_id: config.GOOGLE_CLIENT_ID,
    redirect_uri: config.GOOGLE_OAUTH_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account"
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

export async function googleCallback(req: Request, res: Response) {
  const code = typeof req.query.code === "string" ? req.query.code : undefined;

  if (!code || !config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET || !config.GOOGLE_OAUTH_REDIRECT_URI) {
    return res.redirect(`${config.WEB_ORIGIN}?authError=google`);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.GOOGLE_CLIENT_ID,
      client_secret: config.GOOGLE_CLIENT_SECRET,
      redirect_uri: config.GOOGLE_OAUTH_REDIRECT_URI,
      grant_type: "authorization_code"
    })
  });

  if (!tokenResponse.ok) {
    return res.redirect(`${config.WEB_ORIGIN}?authError=google`);
  }

  const tokens = await tokenResponse.json() as { access_token?: string };
  if (!tokens.access_token) {
    return res.redirect(`${config.WEB_ORIGIN}?authError=google`);
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });

  if (!profileResponse.ok) {
    return res.redirect(`${config.WEB_ORIGIN}?authError=google`);
  }

  const profile = googleProfileSchema.parse(await profileResponse.json());
  const user = await prisma.user.upsert({
    where: { oauthIssuer_oauthSubject: { oauthIssuer: "google", oauthSubject: profile.sub } },
    create: {
      email: profile.email,
      displayName: profile.name ?? profile.email,
      avatarUrl: profile.picture,
      oauthIssuer: "google",
      oauthSubject: profile.sub
    },
    update: {
      email: profile.email,
      displayName: profile.name ?? profile.email,
      avatarUrl: profile.picture
    },
    select: { id: true, email: true, phone: true, displayName: true }
  });

  const accessToken = signAccessToken(user);
  res.redirect(`${config.WEB_ORIGIN}?accessToken=${encodeURIComponent(accessToken)}`);
}

const googleProfileSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  picture: z.string().url().optional()
});

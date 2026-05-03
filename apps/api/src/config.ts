import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24),
  REDIS_URL: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().optional()
});

export const config = schema.parse(process.env);

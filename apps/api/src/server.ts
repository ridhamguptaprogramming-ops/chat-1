import express from "express";
import http from "node:http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { Server } from "socket.io";
import { ZodError } from "zod";
import { config } from "./config.js";
import { routes } from "./routes.js";
import { configureRealtime } from "./realtime.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.WEB_ORIGIN,
    credentials: true
  },
  maxHttpBufferSize: 1e6
});

app.use(helmet());
app.use(cors({ origin: config.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", routes);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) return res.status(400).json({ error: error.flatten() });
  console.error(error);
  res.status(500).json({ error: "internal server error" });
});

await configureRealtime(io);

server.listen(config.PORT, () => {
  console.log(`chat api listening on http://localhost:${config.PORT}`);
});

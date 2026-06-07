import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { env } from "./config/env.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { devicesRouter } from "./routes/devices.js";
import { gpsRouter } from "./routes/gps.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { registerSocket } from "./socket/index.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: env.FRONTEND_URL } });

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ success: true, data: { ok: true } }));
app.use("/api/auth", authRouter);
app.use("/api/devices", devicesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/gps", gpsRouter(io));
app.use(errorHandler);

registerSocket(io);

server.listen(env.PORT, () => {
  console.log(`Geonyx API listening on http://localhost:${env.PORT}`);
});

import express from "express";
import session from "express-session";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, existsSync } from "fs";
import authRouter from "./routes/auth.js";
import carsRouter from "./routes/cars.js";
import conditionLogsRouter from "./routes/conditionLogs.js";
import photosRouter from "./routes/photos.js";
import ownershipRouter from "./routes/ownership.js";
import transfersRouter from "./routes/transfers.js";
import usersRouter from "./routes/users.js";
import albumsRouter from "./routes/albums.js";
import adminRouter from "./routes/admin.js";
import "./db/index.js"; // initializes DB and tables on import
const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const app = express();
const PORT = process.env.PORT || 3001;
// Ensure uploads directory
const dataDir = join(__dirname, "../data");
mkdirSync(join(dataDir, "uploads"), { recursive: true });
// Middleware
app.use(cors({
    origin: isProd ? process.env.FRONTEND_URL || true : "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Session
app.use(session({
    secret: process.env.SESSION_SECRET || "collector-car-registry-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProd,
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: isProd ? "strict" : "lax",
    },
    proxy: isProd,
}));
if (isProd) {
    app.set("trust proxy", 1);
}
// Serve uploaded files
app.use("/uploads", express.static(join(dataDir, "uploads")));
// API Routes
app.use("/api/auth", authRouter);
app.use("/api/cars", carsRouter);
app.use("/api/logs", conditionLogsRouter);
app.use("/api/photos", photosRouter);
app.use("/api/ownership", ownershipRouter);
app.use("/api/transfers", transfersRouter);
app.use("/api/users", usersRouter);
app.use("/api/albums", albumsRouter);
app.use("/api/admin", adminRouter);
// Health check
app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
});
// In production, serve the built frontend
const clientDist = join(__dirname, "../../client/dist");
if (isProd && existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // SPA fallback — serve index.html for all non-API routes
    app.get("*", (_req, res) => {
        res.sendFile(join(clientDist, "index.html"));
    });
}
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} (${isProd ? "production" : "development"})`);
});

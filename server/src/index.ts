import express from "express";
import session from "express-session";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, existsSync } from "fs";
import Database from "better-sqlite3";
import BetterSqlite3SessionStore from "better-sqlite3-session-store";

import authRouter from "./routes/auth.js";
import carsRouter from "./routes/cars.js";
import conditionLogsRouter from "./routes/conditionLogs.js";
import photosRouter from "./routes/photos.js";
import ownershipRouter from "./routes/ownership.js";
import transfersRouter from "./routes/transfers.js";
import usersRouter from "./routes/users.js";
import albumsRouter from "./routes/albums.js";
import adminRouter from "./routes/admin.js";
import contactRouter from "./routes/contact.js";
import "./db/index.js"; // initializes DB and tables on import

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory
const dataDir = join(__dirname, "../data");
mkdirSync(join(dataDir, "uploads"), { recursive: true });

// Session store backed by SQLite (persists across deploys)
const SqliteStore = BetterSqlite3SessionStore(session);
const sessionDb = new Database(join(dataDir, "sessions.db"));

// Middleware
app.use(cors({
  origin: isProd ? process.env.FRONTEND_URL || true : "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
  session({
    store: new SqliteStore({
      client: sessionDb,
      expired: { clear: true, intervalMs: 900000 }, // clean expired sessions every 15 min
    }),
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
  })
);

if (isProd) {
  app.set("trust proxy", 1);
}

// Serve uploaded files
app.use("/uploads", express.static(join(dataDir, "uploads")));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: "Too many attempts. Please try again in 15 minutes." },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 messages per hour
  message: { error: "Too many messages. Please try again later." },
});

// API Routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/contact", contactLimiter);
app.use("/api/auth", authRouter);
app.use("/api/cars", carsRouter);
app.use("/api/logs", conditionLogsRouter);
app.use("/api/photos", photosRouter);
app.use("/api/ownership", ownershipRouter);
app.use("/api/transfers", transfersRouter);
app.use("/api/users", usersRouter);
app.use("/api/albums", albumsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/contact", contactRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Dynamic sitemap
app.get("/sitemap.xml", async (_req, res) => {
  try {
    const { cars } = await import("./db/schema.js");
    const { db } = await import("./db/index.js");
    const { eq } = await import("drizzle-orm");

    const publicCars = await db
      .select({ id: cars.id, updatedAt: cars.updatedAt })
      .from(cars)
      .where(eq(cars.isPublic, true));

    const baseUrl = "https://www.collectorprovenance.com";
    const urls: { loc: string; priority: string; changefreq: string; lastmod?: string }[] = [
      { loc: baseUrl, priority: "1.0", changefreq: "daily" },
      { loc: `${baseUrl}/browse`, priority: "0.9", changefreq: "daily" },
      ...publicCars.map((car) => ({
        loc: `${baseUrl}/cars/${car.id}`,
        priority: "0.7",
        changefreq: "weekly",
        lastmod: car.updatedAt ? new Date(car.updatedAt).toISOString().split("T")[0] : undefined,
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
    <changefreq>${u.changefreq}</changefreq>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
  </url>`).join("\n")}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error("Sitemap error:", err);
    res.status(500).send("Error generating sitemap");
  }
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

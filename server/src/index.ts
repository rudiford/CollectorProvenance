import express from "express";
import session from "express-session";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

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

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory
const dataDir = join(__dirname, "../data");
mkdirSync(join(dataDir, "uploads"), { recursive: true });

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "collector-car-registry-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

// Serve uploaded files
app.use("/uploads", express.static(join(dataDir, "uploads")));

// Routes
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

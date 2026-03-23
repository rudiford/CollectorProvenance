import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";
import { db } from "../db/index.js";
import { carPhotos, cars } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadDir = join(__dirname, "../../data/uploads");
mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `${uuidv4()}.${ext}`);
  },
});

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic",
  "application/pdf",
];

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for PDFs
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images and PDFs are allowed"));
    }
  },
});

const router = Router();

// Upload a photo
router.post("/car/:carId", requireAuth, upload.single("photo"), async (req: Request, res: Response) => {
  try {
    const [car] = await db.select().from(cars).where(eq(cars.id, req.params.carId)).limit(1);
    if (!car) return res.status(404).json({ error: "Car not found" });
    if (car.currentOwnerId !== req.session.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { caption, category, dateTaken, setHero, albumId } = req.body;
    const url = `/uploads/${req.file.filename}`;
    const id = uuidv4();

    const [photo] = await db
      .insert(carPhotos)
      .values({
        id,
        carId: req.params.carId,
        uploadedBy: req.session.userId!,
        albumId: albumId || null,
        url,
        caption,
        category: category || "exterior",
        dateTaken,
        createdAt: new Date(),
      })
      .returning();

    // Set as hero photo if requested or if it's the first photo
    const existingPhotos = await db.select().from(carPhotos).where(eq(carPhotos.carId, req.params.carId));
    if (setHero === "true" || existingPhotos.length === 1) {
      await db.update(cars).set({ heroPhotoUrl: url, updatedAt: new Date() }).where(eq(cars.id, req.params.carId));
    }

    return res.json({ photo });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get photos for a car
router.get("/car/:carId", async (req: Request, res: Response) => {
  try {
    const [car] = await db.select().from(cars).where(eq(cars.id, req.params.carId)).limit(1);
    if (!car) return res.status(404).json({ error: "Car not found" });

    const isOwner = req.session.userId === car.currentOwnerId;
    if (!car.isPublic && !isOwner) {
      return res.status(403).json({ error: "This car is private" });
    }

    const photos = await db
      .select()
      .from(carPhotos)
      .where(eq(carPhotos.carId, req.params.carId))
      .orderBy(desc(carPhotos.createdAt));

    return res.json({ photos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a photo
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const [photo] = await db.select().from(carPhotos).where(eq(carPhotos.id, req.params.id)).limit(1);
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    if (photo.uploadedBy !== req.session.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await db.delete(carPhotos).where(eq(carPhotos.id, req.params.id));
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Set hero photo
router.patch("/car/:carId/hero/:photoId", requireAuth, async (req: Request, res: Response) => {
  try {
    const [car] = await db.select().from(cars).where(eq(cars.id, req.params.carId)).limit(1);
    if (!car) return res.status(404).json({ error: "Car not found" });
    if (car.currentOwnerId !== req.session.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const [photo] = await db.select().from(carPhotos).where(eq(carPhotos.id, req.params.photoId)).limit(1);
    if (!photo) return res.status(404).json({ error: "Photo not found" });

    await db.update(cars).set({ heroPhotoUrl: photo.url, updatedAt: new Date() }).where(eq(cars.id, req.params.carId));
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

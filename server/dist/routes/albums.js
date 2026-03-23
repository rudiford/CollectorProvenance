import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import { photoAlbums, carPhotos, cars } from "../db/schema.js";
import { eq, asc, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
// Get albums for a car
router.get("/car/:carId", async (req, res) => {
    try {
        const [car] = await db.select().from(cars).where(eq(cars.id, req.params.carId)).limit(1);
        if (!car)
            return res.status(404).json({ error: "Car not found" });
        const isOwner = req.session.userId === car.currentOwnerId;
        if (!car.isPublic && !isOwner) {
            return res.status(403).json({ error: "This car is private" });
        }
        const albums = await db
            .select()
            .from(photoAlbums)
            .where(eq(photoAlbums.carId, req.params.carId))
            .orderBy(asc(photoAlbums.sortOrder), desc(photoAlbums.createdAt));
        // Get photo counts per album
        const allPhotos = await db
            .select({ id: carPhotos.id, albumId: carPhotos.albumId })
            .from(carPhotos)
            .where(eq(carPhotos.carId, req.params.carId));
        const albumsWithCounts = albums.map((album) => ({
            ...album,
            photoCount: allPhotos.filter((p) => p.albumId === album.id).length,
        }));
        // Count unorganized photos (no album)
        const unorganizedCount = allPhotos.filter((p) => !p.albumId).length;
        return res.json({ albums: albumsWithCounts, unorganizedCount });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Create album
router.post("/car/:carId", requireAuth, async (req, res) => {
    try {
        const [car] = await db.select().from(cars).where(eq(cars.id, req.params.carId)).limit(1);
        if (!car)
            return res.status(404).json({ error: "Car not found" });
        if (car.currentOwnerId !== req.session.userId) {
            return res.status(403).json({ error: "Not authorized" });
        }
        const { name, description } = req.body;
        if (!name)
            return res.status(400).json({ error: "Album name is required" });
        const id = uuidv4();
        const [album] = await db
            .insert(photoAlbums)
            .values({
            id,
            carId: req.params.carId,
            createdBy: req.session.userId,
            name,
            description,
            createdAt: new Date(),
        })
            .returning();
        return res.json({ album });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Update album
router.patch("/:id", requireAuth, async (req, res) => {
    try {
        const [album] = await db.select().from(photoAlbums).where(eq(photoAlbums.id, req.params.id)).limit(1);
        if (!album)
            return res.status(404).json({ error: "Album not found" });
        if (album.createdBy !== req.session.userId) {
            return res.status(403).json({ error: "Not authorized" });
        }
        const { name, description, sortOrder } = req.body;
        const [updated] = await db
            .update(photoAlbums)
            .set({ name, description, sortOrder })
            .where(eq(photoAlbums.id, req.params.id))
            .returning();
        return res.json({ album: updated });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Delete album (photos become unorganized, not deleted)
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const [album] = await db.select().from(photoAlbums).where(eq(photoAlbums.id, req.params.id)).limit(1);
        if (!album)
            return res.status(404).json({ error: "Album not found" });
        if (album.createdBy !== req.session.userId) {
            return res.status(403).json({ error: "Not authorized" });
        }
        // Remove album reference from photos (don't delete the photos)
        await db.update(carPhotos).set({ albumId: null }).where(eq(carPhotos.albumId, req.params.id));
        await db.delete(photoAlbums).where(eq(photoAlbums.id, req.params.id));
        return res.json({ ok: true });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Move photo to album
router.patch("/photo/:photoId/move", requireAuth, async (req, res) => {
    try {
        const [photo] = await db.select().from(carPhotos).where(eq(carPhotos.id, req.params.photoId)).limit(1);
        if (!photo)
            return res.status(404).json({ error: "Photo not found" });
        if (photo.uploadedBy !== req.session.userId) {
            return res.status(403).json({ error: "Not authorized" });
        }
        const { albumId } = req.body; // null to remove from album
        await db.update(carPhotos).set({ albumId: albumId || null }).where(eq(carPhotos.id, req.params.photoId));
        return res.json({ ok: true });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
export default router;

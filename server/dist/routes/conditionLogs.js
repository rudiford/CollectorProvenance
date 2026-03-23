import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import { conditionLogs, cars, users } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
// Get logs for a car
router.get("/car/:carId", async (req, res) => {
    try {
        const [car] = await db.select().from(cars).where(eq(cars.id, req.params.carId)).limit(1);
        if (!car)
            return res.status(404).json({ error: "Car not found" });
        const isOwner = req.session.userId === car.currentOwnerId;
        if (!car.isPublic && !isOwner) {
            return res.status(403).json({ error: "This car is private" });
        }
        const logs = await db
            .select({
            id: conditionLogs.id,
            carId: conditionLogs.carId,
            authorId: conditionLogs.authorId,
            date: conditionLogs.date,
            mileage: conditionLogs.mileage,
            logType: conditionLogs.logType,
            title: conditionLogs.title,
            description: conditionLogs.description,
            shopName: conditionLogs.shopName,
            createdAt: conditionLogs.createdAt,
            authorUsername: users.username,
            authorDisplayName: users.displayName,
        })
            .from(conditionLogs)
            .leftJoin(users, eq(conditionLogs.authorId, users.id))
            .where(eq(conditionLogs.carId, req.params.carId))
            .orderBy(desc(conditionLogs.date));
        return res.json({ logs });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Add a log entry
router.post("/car/:carId", requireAuth, async (req, res) => {
    try {
        const [car] = await db.select().from(cars).where(eq(cars.id, req.params.carId)).limit(1);
        if (!car)
            return res.status(404).json({ error: "Car not found" });
        if (car.currentOwnerId !== req.session.userId) {
            return res.status(403).json({ error: "Only the owner can add log entries" });
        }
        const { date, mileage, logType, title, description, shopName } = req.body;
        if (!date || !title || !description) {
            return res.status(400).json({ error: "Date, title, and description are required" });
        }
        const id = uuidv4();
        const [log] = await db
            .insert(conditionLogs)
            .values({
            id,
            carId: req.params.carId,
            authorId: req.session.userId,
            date,
            mileage: mileage ? parseInt(mileage) : null,
            logType: logType || "observation",
            title,
            description,
            shopName,
            createdAt: new Date(),
        })
            .returning();
        return res.json({ log });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Update a log entry
router.patch("/:id", requireAuth, async (req, res) => {
    try {
        const [log] = await db.select().from(conditionLogs).where(eq(conditionLogs.id, req.params.id)).limit(1);
        if (!log)
            return res.status(404).json({ error: "Log not found" });
        if (log.authorId !== req.session.userId) {
            return res.status(403).json({ error: "Not authorized" });
        }
        const [updated] = await db
            .update(conditionLogs)
            .set(req.body)
            .where(eq(conditionLogs.id, req.params.id))
            .returning();
        return res.json({ log: updated });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Delete a log entry
router.delete("/:id", requireAuth, async (req, res) => {
    try {
        const [log] = await db.select().from(conditionLogs).where(eq(conditionLogs.id, req.params.id)).limit(1);
        if (!log)
            return res.status(404).json({ error: "Log not found" });
        if (log.authorId !== req.session.userId) {
            return res.status(403).json({ error: "Not authorized" });
        }
        await db.delete(conditionLogs).where(eq(conditionLogs.id, req.params.id));
        return res.json({ ok: true });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
export default router;

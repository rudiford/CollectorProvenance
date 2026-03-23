import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import { ownershipRecords, cars, users } from "../db/schema.js";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Get ownership history for a car
router.get("/car/:carId", async (req: Request, res: Response) => {
  try {
    const [car] = await db.select().from(cars).where(eq(cars.id, req.params.carId)).limit(1);
    if (!car) return res.status(404).json({ error: "Car not found" });

    const isOwner = req.session.userId === car.currentOwnerId;
    if (!car.isPublic && !isOwner) {
      return res.status(403).json({ error: "This car is private" });
    }

    const records = await db
      .select({
        id: ownershipRecords.id,
        carId: ownershipRecords.carId,
        ownerId: ownershipRecords.ownerId,
        ownerName: ownershipRecords.ownerName,
        fromDate: ownershipRecords.fromDate,
        toDate: ownershipRecords.toDate,
        acquisitionType: ownershipRecords.acquisitionType,
        acquisitionSource: ownershipRecords.acquisitionSource,
        notes: ownershipRecords.notes,
        createdAt: ownershipRecords.createdAt,
        username: users.username,
        displayName: users.displayName,
      })
      .from(ownershipRecords)
      .leftJoin(users, eq(ownershipRecords.ownerId, users.id))
      .where(eq(ownershipRecords.carId, req.params.carId))
      .orderBy(asc(ownershipRecords.fromDate));

    return res.json({ records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Add a historical ownership record (owner only)
router.post("/car/:carId", requireAuth, async (req: Request, res: Response) => {
  try {
    const [car] = await db.select().from(cars).where(eq(cars.id, req.params.carId)).limit(1);
    if (!car) return res.status(404).json({ error: "Car not found" });
    if (car.currentOwnerId !== req.session.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { ownerName, fromDate, toDate, acquisitionType, acquisitionSource, notes } = req.body;
    if (!fromDate) {
      return res.status(400).json({ error: "From date is required" });
    }

    const [record] = await db
      .insert(ownershipRecords)
      .values({
        id: uuidv4(),
        carId: req.params.carId,
        ownerName,
        fromDate,
        toDate,
        acquisitionType: acquisitionType || "unknown",
        acquisitionSource,
        notes,
        createdAt: new Date(),
      })
      .returning();

    return res.json({ record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

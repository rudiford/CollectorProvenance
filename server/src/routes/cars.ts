import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import { cars, carPhotos, conditionLogs, ownershipRecords, users } from "../db/schema.js";
import { eq, and, or, like, desc, asc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Browse/search public cars
router.get("/", async (req: Request, res: Response) => {
  try {
    const { model, make, year, status, country, q, limit = "20", offset = "0" } = req.query;

    let query = db
      .select({
        id: cars.id,
        chassisNumber: cars.chassisNumber,
        year: cars.year,
        make: cars.make,
        model: cars.model,
        variant: cars.variant,
        factoryColorName: cars.factoryColorName,
        currentStatus: cars.currentStatus,
        locationState: cars.locationState,
        locationCountry: cars.locationCountry,
        willingToSell: cars.willingToSell,
        heroPhotoUrl: cars.heroPhotoUrl,
        ownerUsername: users.username,
        ownerDisplayName: users.displayName,
        ownerShowIdentity: users.showIdentity,
        ownerId: users.id,
      })
      .from(cars)
      .leftJoin(users, eq(cars.currentOwnerId, users.id))
      .where(eq(cars.isPublic, true));

    const rawResults = await query.orderBy(desc(cars.createdAt)).limit(parseInt(limit as string)).offset(parseInt(offset as string));

    // Anonymize owners who have hidden their identity
    const results = rawResults.map((c) => {
      if (!c.ownerShowIdentity) {
        const anonId = "USER" + (c.ownerId || "").replace(/-/g, "").slice(0, 4).toUpperCase();
        return { ...c, ownerUsername: anonId, ownerDisplayName: anonId, ownerShowIdentity: undefined, ownerId: undefined };
      }
      return { ...c, ownerShowIdentity: undefined, ownerId: undefined };
    });

    // Filter in JS for flexibility (SQLite doesn't support complex OR easily)
    let filtered = results;
    if (q) {
      const search = (q as string).toLowerCase();
      filtered = results.filter(
        (c) =>
          c.model?.toLowerCase().includes(search) ||
          c.variant?.toLowerCase().includes(search) ||
          c.factoryColorName?.toLowerCase().includes(search) ||
          c.chassisNumber?.toLowerCase().includes(search) ||
          c.year?.toString().includes(search)
      );
    }
    if (make) filtered = filtered.filter((c) => c.make?.toLowerCase() === (make as string).toLowerCase());
    if (model) filtered = filtered.filter((c) => c.model?.toLowerCase() === (model as string).toLowerCase());
    if (year) filtered = filtered.filter((c) => c.year === parseInt(year as string));
    if (status) filtered = filtered.filter((c) => c.currentStatus === status);
    if (country) filtered = filtered.filter((c) => c.locationCountry === country);

    return res.json({ cars: filtered });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get my cars (auth required) — must be before /:id to avoid route conflict
router.get("/user/mine", requireAuth, async (req: Request, res: Response) => {
  try {
    const myCars = await db
      .select()
      .from(cars)
      .where(eq(cars.currentOwnerId, req.session.userId!))
      .orderBy(desc(cars.createdAt));
    return res.json({ cars: myCars });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get a single car (public or owned)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const [car] = await db
      .select()
      .from(cars)
      .where(eq(cars.id, req.params.id))
      .limit(1);

    if (!car) return res.status(404).json({ error: "Car not found" });

    const isOwner = req.session.userId === car.currentOwnerId;
    if (!car.isPublic && !isOwner) {
      return res.status(403).json({ error: "This car is private" });
    }

    // Fetch related data
    const [ownerFull] = await db
      .select()
      .from(users)
      .where(eq(users.id, car.currentOwnerId))
      .limit(1);

    // If owner has hidden identity and viewer is not the owner, mask them
    const anonId = "USER" + car.currentOwnerId.replace(/-/g, "").slice(0, 6).toUpperCase();
    const owner = (!isOwner && ownerFull && !ownerFull.showIdentity)
      ? { id: ownerFull.id, username: anonId, displayName: anonId }
      : ownerFull ? { id: ownerFull.id, username: ownerFull.username, displayName: ownerFull.displayName } : null;

    const photos = await db
      .select()
      .from(carPhotos)
      .where(eq(carPhotos.carId, car.id))
      .orderBy(desc(carPhotos.createdAt));

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
      .where(eq(conditionLogs.carId, car.id))
      .orderBy(desc(conditionLogs.date));

    const ownership = await db
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
      .where(eq(ownershipRecords.carId, car.id))
      .orderBy(asc(ownershipRecords.fromDate));

    return res.json({ car, owner, photos, logs, ownership, isOwner });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Create a car (auth required)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      chassisNumber, year, make, model, variant, engineNumber, transmissionNumber,
      factoryColorCode, factoryColorName, factoryInterior, factoryOptions,
      currentStatus, locationState, locationCountry, isPublic, willingToSell,
    } = req.body;

    if (!year || !model) {
      return res.status(400).json({ error: "Year and model are required" });
    }

    const id = uuidv4();
    const now = new Date();

    const [car] = await db
      .insert(cars)
      .values({
        id,
        chassisNumber,
        year: parseInt(year),
        make: make || "Porsche",
        model,
        variant,
        engineNumber,
        transmissionNumber,
        factoryColorCode,
        factoryColorName,
        factoryInterior,
        factoryOptions: factoryOptions ? JSON.stringify(factoryOptions) : null,
        currentStatus: currentStatus || "original",
        locationState,
        locationCountry: locationCountry || "US",
        isPublic: isPublic ?? false,
        willingToSell: willingToSell ?? false,
        currentOwnerId: req.session.userId!,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Create initial ownership record
    await db.insert(ownershipRecords).values({
      id: uuidv4(),
      carId: id,
      ownerId: req.session.userId!,
      fromDate: new Date().toISOString().split("T")[0],
      acquisitionType: "unknown",
      createdAt: now,
    });

    return res.json({ car });
  } catch (err: any) {
    console.error(err);
    if (err.message?.includes("UNIQUE constraint")) {
      return res.status(400).json({ error: "A car with this chassis number already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update a car
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const [car] = await db.select().from(cars).where(eq(cars.id, req.params.id)).limit(1);
    if (!car) return res.status(404).json({ error: "Car not found" });
    if (car.currentOwnerId !== req.session.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updates = { ...req.body, updatedAt: new Date() };
    if (updates.factoryOptions && typeof updates.factoryOptions === "object") {
      updates.factoryOptions = JSON.stringify(updates.factoryOptions);
    }

    const [updated] = await db
      .update(cars)
      .set(updates)
      .where(eq(cars.id, req.params.id))
      .returning();

    return res.json({ car: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a car
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const [car] = await db.select().from(cars).where(eq(cars.id, req.params.id)).limit(1);
    if (!car) return res.status(404).json({ error: "Car not found" });
    if (car.currentOwnerId !== req.session.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await db.delete(cars).where(eq(cars.id, req.params.id));
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

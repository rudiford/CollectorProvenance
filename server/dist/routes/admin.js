import { Router } from "express";
import { db } from "../db/index.js";
import { users, cars, carPhotos, conditionLogs } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/admin.js";
const router = Router();
// All routes require admin
router.use(requireAdmin);
// Get all users (with full details regardless of privacy)
router.get("/users", async (_req, res) => {
    try {
        const allUsers = await db
            .select({
            id: users.id,
            username: users.username,
            email: users.email,
            displayName: users.displayName,
            bio: users.bio,
            locationCity: users.locationCity,
            locationState: users.locationState,
            locationCountry: users.locationCountry,
            phone: users.phone,
            website: users.website,
            instagram: users.instagram,
            showIdentity: users.showIdentity,
            isAdmin: users.isAdmin,
            createdAt: users.createdAt,
        })
            .from(users)
            .orderBy(desc(users.createdAt));
        // Get car counts per user
        const allCars = await db.select({ id: cars.id, ownerId: cars.currentOwnerId, isPublic: cars.isPublic }).from(cars);
        const usersWithStats = allUsers.map((u) => {
            const userCars = allCars.filter((c) => c.ownerId === u.id);
            return {
                ...u,
                totalCars: userCars.length,
                publicCars: userCars.filter((c) => c.isPublic).length,
                privateCars: userCars.filter((c) => !c.isPublic).length,
            };
        });
        return res.json({ users: usersWithStats });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Get all cars (regardless of public/private)
router.get("/cars", async (_req, res) => {
    try {
        const allCars = await db
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
            isPublic: cars.isPublic,
            willingToSell: cars.willingToSell,
            heroPhotoUrl: cars.heroPhotoUrl,
            ownerUsername: users.username,
            ownerDisplayName: users.displayName,
            ownerEmail: users.email,
            createdAt: cars.createdAt,
        })
            .from(cars)
            .leftJoin(users, eq(cars.currentOwnerId, users.id))
            .orderBy(desc(cars.createdAt));
        return res.json({ cars: allCars });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Get a specific user's full profile (admin override)
router.get("/users/:id", async (req, res) => {
    try {
        const [user] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        const { passwordHash: _, ...safeUser } = user;
        const userCars = await db
            .select()
            .from(cars)
            .where(eq(cars.currentOwnerId, user.id))
            .orderBy(desc(cars.createdAt));
        return res.json({ user: safeUser, cars: userCars });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Dashboard stats
router.get("/stats", async (_req, res) => {
    try {
        const allUsers = await db.select({ id: users.id }).from(users);
        const allCars = await db.select({ id: cars.id, isPublic: cars.isPublic }).from(cars);
        const allPhotos = await db.select({ id: carPhotos.id }).from(carPhotos);
        const allLogs = await db.select({ id: conditionLogs.id }).from(conditionLogs);
        return res.json({
            totalUsers: allUsers.length,
            totalCars: allCars.length,
            publicCars: allCars.filter((c) => c.isPublic).length,
            privateCars: allCars.filter((c) => !c.isPublic).length,
            totalPhotos: allPhotos.length,
            totalLogs: allLogs.length,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
export default router;

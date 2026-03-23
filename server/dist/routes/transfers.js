import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/index.js";
import { transferCodes, cars, ownershipRecords } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
const router = Router();
// Generate a transfer code (current owner)
router.post("/generate/:carId", requireAuth, async (req, res) => {
    try {
        const [car] = await db.select().from(cars).where(eq(cars.id, req.params.carId)).limit(1);
        if (!car)
            return res.status(404).json({ error: "Car not found" });
        if (car.currentOwnerId !== req.session.userId) {
            return res.status(403).json({ error: "Only the owner can generate a transfer code" });
        }
        // Cancel any existing pending codes for this car
        await db
            .update(transferCodes)
            .set({ status: "cancelled" })
            .where(and(eq(transferCodes.carId, req.params.carId), eq(transferCodes.status, "pending")));
        const code = generateCode();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const [transfer] = await db
            .insert(transferCodes)
            .values({
            id: uuidv4(),
            carId: req.params.carId,
            initiatedBy: req.session.userId,
            code,
            expiresAt,
            status: "pending",
            createdAt: new Date(),
        })
            .returning();
        return res.json({ transfer });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Claim a transfer code (new owner)
router.post("/claim", requireAuth, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code)
            return res.status(400).json({ error: "Transfer code is required" });
        const [transfer] = await db
            .select()
            .from(transferCodes)
            .where(eq(transferCodes.code, code.toUpperCase()))
            .limit(1);
        if (!transfer)
            return res.status(404).json({ error: "Invalid transfer code" });
        if (transfer.status !== "pending") {
            return res.status(400).json({ error: `Transfer code is ${transfer.status}` });
        }
        if (new Date() > transfer.expiresAt) {
            await db.update(transferCodes).set({ status: "expired" }).where(eq(transferCodes.id, transfer.id));
            return res.status(400).json({ error: "Transfer code has expired" });
        }
        if (transfer.initiatedBy === req.session.userId) {
            return res.status(400).json({ error: "You cannot claim your own transfer code" });
        }
        const now = new Date();
        const today = now.toISOString().split("T")[0];
        // Close the previous ownership record
        await db
            .update(ownershipRecords)
            .set({ toDate: today })
            .where(and(eq(ownershipRecords.carId, transfer.carId), eq(ownershipRecords.toDate, null)));
        // Create new ownership record
        await db.insert(ownershipRecords).values({
            id: uuidv4(),
            carId: transfer.carId,
            ownerId: req.session.userId,
            fromDate: today,
            acquisitionType: "private_sale",
            notes: "Transferred via registry transfer code",
            createdAt: now,
        });
        // Update car's current owner
        await db
            .update(cars)
            .set({ currentOwnerId: req.session.userId, updatedAt: now })
            .where(eq(cars.id, transfer.carId));
        // Mark transfer as claimed
        await db
            .update(transferCodes)
            .set({ status: "claimed", claimedBy: req.session.userId, claimedAt: now })
            .where(eq(transferCodes.id, transfer.id));
        const [car] = await db.select().from(cars).where(eq(cars.id, transfer.carId)).limit(1);
        return res.json({ car, message: "Ownership transferred successfully" });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Cancel a transfer code
router.post("/cancel/:transferId", requireAuth, async (req, res) => {
    try {
        const [transfer] = await db
            .select()
            .from(transferCodes)
            .where(eq(transferCodes.id, req.params.transferId))
            .limit(1);
        if (!transfer)
            return res.status(404).json({ error: "Transfer not found" });
        if (transfer.initiatedBy !== req.session.userId) {
            return res.status(403).json({ error: "Not authorized" });
        }
        await db.update(transferCodes).set({ status: "cancelled" }).where(eq(transferCodes.id, req.params.transferId));
        return res.json({ ok: true });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Get active transfer for a car
router.get("/car/:carId", requireAuth, async (req, res) => {
    try {
        const [car] = await db.select().from(cars).where(eq(cars.id, req.params.carId)).limit(1);
        if (!car)
            return res.status(404).json({ error: "Car not found" });
        if (car.currentOwnerId !== req.session.userId) {
            return res.status(403).json({ error: "Not authorized" });
        }
        const [transfer] = await db
            .select()
            .from(transferCodes)
            .where(and(eq(transferCodes.carId, req.params.carId), eq(transferCodes.status, "pending")))
            .limit(1);
        return res.json({ transfer: transfer || null });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
export default router;

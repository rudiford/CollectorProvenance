import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
export async function requireAdmin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
    }
    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
    if (!user || !user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
    }
    return next();
}

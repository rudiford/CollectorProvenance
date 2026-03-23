import { Router } from "express";
import { db } from "../db/index.js";
import { users, cars } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
// Shared profile response builder
async function buildProfileResponse(req, res, user) {
    const isOwnProfile = req.session.userId === user.id;
    const anonId = "USER" + user.id.replace(/-/g, "").slice(0, 6).toUpperCase();
    let publicUser;
    if (isOwnProfile) {
        publicUser = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
            email: user.email,
            phone: user.phone,
            locationCity: user.locationCity,
            locationState: user.locationState,
            locationCountry: user.locationCountry,
            website: user.website,
            instagram: user.instagram,
            showEmail: user.showEmail,
            showPhone: user.showPhone,
            showCity: user.showCity,
            showState: user.showState,
            showCountry: user.showCountry,
            showWebsite: user.showWebsite,
            showInstagram: user.showInstagram,
            showIdentity: user.showIdentity,
        };
    }
    else if (!user.showIdentity) {
        publicUser = {
            id: user.id,
            username: anonId,
            displayName: anonId,
            bio: null,
            avatarUrl: null,
            createdAt: user.createdAt,
            isAnonymous: true,
        };
    }
    else {
        publicUser = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
        };
        if (user.showEmail)
            publicUser.email = user.email;
        if (user.showPhone)
            publicUser.phone = user.phone;
        if (user.showCity)
            publicUser.locationCity = user.locationCity;
        if (user.showState)
            publicUser.locationState = user.locationState;
        if (user.showCountry)
            publicUser.locationCountry = user.locationCountry;
        if (user.showWebsite)
            publicUser.website = user.website;
        if (user.showInstagram)
            publicUser.instagram = user.instagram;
        publicUser.showCity = user.showCity;
        publicUser.showState = user.showState;
        publicUser.showCountry = user.showCountry;
        publicUser.showWebsite = user.showWebsite;
        publicUser.showInstagram = user.showInstagram;
    }
    const allCars = await db
        .select()
        .from(cars)
        .where(eq(cars.currentOwnerId, user.id))
        .orderBy(desc(cars.createdAt));
    const visibleCars = isOwnProfile ? allCars : allCars.filter((c) => c.isPublic);
    return res.json({ user: publicUser, cars: visibleCars });
}
// Get user profile by ID
router.get("/id/:id", async (req, res) => {
    try {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, req.params.id))
            .limit(1);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        return buildProfileResponse(req, res, user);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Get user profile by username
router.get("/:username", async (req, res) => {
    try {
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, req.params.username))
            .limit(1);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        return buildProfileResponse(req, res, user);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
// Update own profile
router.patch("/me/profile", requireAuth, async (req, res) => {
    console.log("Profile update request received:", JSON.stringify(req.body));
    try {
        const { displayName, bio, locationCity, locationState, locationCountry, phone, website, instagram, showEmail, showPhone, showCity, showState, showCountry, showWebsite, showInstagram, showIdentity, } = req.body;
        const [updated] = await db
            .update(users)
            .set({
            displayName, bio, locationCity, locationState, locationCountry,
            phone, website, instagram,
            showEmail: showEmail ?? false,
            showPhone: showPhone ?? false,
            showCity: showCity ?? false,
            showState: showState ?? false,
            showCountry: showCountry ?? false,
            showWebsite: showWebsite ?? true,
            showInstagram: showInstagram ?? true,
            showIdentity: showIdentity ?? true,
        })
            .where(eq(users.id, req.session.userId))
            .returning();
        const { passwordHash: _, ...safeUser } = updated;
        return res.json({ user: safeUser });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
export default router;

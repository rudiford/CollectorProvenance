import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import xss from "xss";
import { db } from "../db/index.js";
import { cars, users, contactMessages } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Send a message to a car owner
router.post("/car/:carId", async (req: Request, res: Response) => {
  try {
    const senderName = xss(req.body.senderName?.trim() || "");
    const senderEmail = xss(req.body.senderEmail?.trim() || "");
    const message = xss(req.body.message?.trim() || "");
    if (!senderName || !senderEmail || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }

    const [car] = await db.select().from(cars).where(eq(cars.id, req.params.carId)).limit(1);
    if (!car) return res.status(404).json({ error: "Car not found" });
    if (!car.isPublic) return res.status(403).json({ error: "This car is not publicly listed" });

    const [owner] = await db.select().from(users).where(eq(users.id, car.currentOwnerId)).limit(1);
    if (!owner) return res.status(404).json({ error: "Owner not found" });

    // Store the message
    const id = uuidv4();
    await db.insert(contactMessages).values({
      id,
      carId: car.id,
      ownerId: owner.id,
      senderName,
      senderEmail,
      message,
      carDescription: `${car.year} ${car.make} ${car.model}${car.variant ? " " + car.variant : ""}`,
      status: "unread",
      createdAt: new Date(),
    });

    // TODO: Send email via SendGrid/Resend when configured
    // For now, store the message and the owner can view it in their inbox
    // When email is configured, uncomment and set SENDGRID_API_KEY or RESEND_API_KEY env var
    
    const emailConfigured = process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY;
    if (emailConfigured) {
      try {
        await sendNotificationEmail(owner.email, {
          senderName,
          senderEmail,
          message,
          carDescription: `${car.year} ${car.make} ${car.model}${car.variant ? " " + car.variant : ""}`,
        });
      } catch (emailErr) {
        console.error("Failed to send notification email:", emailErr);
        // Don't fail the request — message is still stored
      }
    }

    return res.json({ ok: true, message: "Your message has been sent to the owner." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get messages for the logged-in user (their inbox)
router.get("/inbox", requireAuth, async (req: Request, res: Response) => {
  try {
    const messages = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.ownerId, req.session.userId!))
      .orderBy(desc(contactMessages.createdAt));

    return res.json({ messages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Mark message as read
router.patch("/:id/read", requireAuth, async (req: Request, res: Response) => {
  try {
    const [msg] = await db.select().from(contactMessages).where(eq(contactMessages.id, req.params.id)).limit(1);
    if (!msg) return res.status(404).json({ error: "Message not found" });
    if (msg.ownerId !== req.session.userId) return res.status(403).json({ error: "Not authorized" });

    await db.update(contactMessages).set({ status: "read" }).where(eq(contactMessages.id, req.params.id));
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete message
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const [msg] = await db.select().from(contactMessages).where(eq(contactMessages.id, req.params.id)).limit(1);
    if (!msg) return res.status(404).json({ error: "Message not found" });
    if (msg.ownerId !== req.session.userId) return res.status(403).json({ error: "Not authorized" });

    await db.delete(contactMessages).where(eq(contactMessages.id, req.params.id));
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Placeholder email function — swap in SendGrid or Resend when ready
async function sendNotificationEmail(
  toEmail: string,
  data: { senderName: string; senderEmail: string; message: string; carDescription: string }
) {
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Collector Provenance <noreply@collectorprovenance.com>",
        to: toEmail,
        subject: `New inquiry about your ${data.carDescription}`,
        html: `
          <h2>Someone is interested in your ${data.carDescription}</h2>
          <p><strong>From:</strong> ${data.senderName} (${data.senderEmail})</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left: 3px solid #ccc; padding-left: 12px; margin: 12px 0;">${data.message}</blockquote>
          <p style="color: #666; font-size: 12px;">You can reply directly to ${data.senderEmail} if you'd like to connect.</p>
          <p style="color: #666; font-size: 12px;">— Collector Provenance</p>
        `,
      }),
    });
    if (!res.ok) throw new Error(`Resend API error: ${res.status}`);
  }
}

export default router;

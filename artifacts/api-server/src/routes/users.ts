import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

router.post("/users", async (req, res) => {
  try {
    const { name, phone, role } = req.body;
    if (!name || !phone || !role) {
      res.status(400).json({ error: "bad_request", message: "name, phone, and role are required" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    if (existing.length > 0) {
      const user = existing[0];
      res.json({
        ...user,
        createdAt: user.createdAt.toISOString(),
      });
      return;
    }

    const id = generateId();
    const [user] = await db.insert(usersTable).values({ id, name, phone, role }).returning();
    res.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to create user" });
  }
});

router.get("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "not_found", message: "User not found" });
      return;
    }
    res.json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to get user" });
  }
});

export default router;

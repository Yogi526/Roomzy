import { Router, type IRouter } from "express";
import { db, roomsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function mapRoom(room: typeof roomsTable.$inferSelect) {
  return {
    ...room,
    amenities: JSON.parse(room.amenities || "[]"),
    images: JSON.parse(room.images || "[]"),
    createdAt: room.createdAt.toISOString(),
  };
}

router.get("/rooms", async (req, res) => {
  try {
    const { ownerId, city } = req.query as { ownerId?: string; city?: string };
    let rooms;
    if (ownerId && city) {
      rooms = await db.select().from(roomsTable).where(and(eq(roomsTable.ownerId, ownerId), eq(roomsTable.city, city)));
    } else if (ownerId) {
      rooms = await db.select().from(roomsTable).where(eq(roomsTable.ownerId, ownerId));
    } else if (city) {
      rooms = await db.select().from(roomsTable).where(eq(roomsTable.city, city));
    } else {
      rooms = await db.select().from(roomsTable);
    }
    res.json(rooms.map(mapRoom));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to list rooms" });
  }
});

router.post("/rooms", async (req, res) => {
  try {
    const body = req.body;
    if (!body.ownerId || !body.title || !body.city) {
      res.status(400).json({ error: "bad_request", message: "ownerId, title, city are required" });
      return;
    }

    const id = generateId();
    const [room] = await db.insert(roomsTable).values({
      id,
      ownerId: body.ownerId,
      ownerName: body.ownerName,
      title: body.title,
      description: body.description,
      city: body.city,
      address: body.address,
      pricePerHour: body.pricePerHour,
      pricePerDay: body.pricePerDay,
      roomType: body.roomType,
      amenities: JSON.stringify(body.amenities || []),
      maxGuests: body.maxGuests || 1,
      images: JSON.stringify(body.images || []),
      isAvailable: true,
    }).returning();

    res.status(201).json(mapRoom(room));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to create room" });
  }
});

router.get("/rooms/:roomId", async (req, res) => {
  try {
    const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, req.params.roomId)).limit(1);
    if (!room) {
      res.status(404).json({ error: "not_found", message: "Room not found" });
      return;
    }
    res.json(mapRoom(room));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to get room" });
  }
});

router.put("/rooms/:roomId", async (req, res) => {
  try {
    const body = req.body;
    const updates: Partial<typeof roomsTable.$inferInsert> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.city !== undefined) updates.city = body.city;
    if (body.address !== undefined) updates.address = body.address;
    if (body.pricePerHour !== undefined) updates.pricePerHour = body.pricePerHour;
    if (body.pricePerDay !== undefined) updates.pricePerDay = body.pricePerDay;
    if (body.roomType !== undefined) updates.roomType = body.roomType;
    if (body.amenities !== undefined) updates.amenities = JSON.stringify(body.amenities);
    if (body.maxGuests !== undefined) updates.maxGuests = body.maxGuests;
    if (body.images !== undefined) updates.images = JSON.stringify(body.images);
    if (body.isAvailable !== undefined) updates.isAvailable = body.isAvailable;

    const [room] = await db.update(roomsTable).set(updates).where(eq(roomsTable.id, req.params.roomId)).returning();
    if (!room) {
      res.status(404).json({ error: "not_found", message: "Room not found" });
      return;
    }
    res.json(mapRoom(room));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to update room" });
  }
});

router.delete("/rooms/:roomId", async (req, res) => {
  try {
    await db.delete(roomsTable).where(eq(roomsTable.id, req.params.roomId));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to delete room" });
  }
});

export default router;

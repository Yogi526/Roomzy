import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function mapOrder(order: typeof ordersTable.$inferSelect) {
  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
  };
}

router.get("/orders", async (req, res) => {
  try {
    const { renterId, ownerId, status } = req.query as { renterId?: string; ownerId?: string; status?: string };
    let orders;
    if (renterId) {
      orders = await db.select().from(ordersTable).where(eq(ordersTable.renterId, renterId));
    } else if (ownerId) {
      orders = await db.select().from(ordersTable).where(eq(ordersTable.ownerId, ownerId));
    } else {
      orders = await db.select().from(ordersTable);
    }

    if (status) {
      orders = orders.filter((o) => o.status === status);
    }

    res.json(orders.map(mapOrder));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to list orders" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const body = req.body;
    if (!body.roomId || !body.renterId || !body.ownerId) {
      res.status(400).json({ error: "bad_request", message: "roomId, renterId, ownerId are required" });
      return;
    }

    const id = generateId();
    const [order] = await db.insert(ordersTable).values({
      id,
      roomId: body.roomId,
      roomTitle: body.roomTitle || "Room",
      roomAddress: body.roomAddress || "",
      renterId: body.renterId,
      renterName: body.renterName,
      renterPhone: body.renterPhone,
      ownerId: body.ownerId,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      bookingType: body.bookingType,
      totalAmount: body.totalAmount,
      guests: body.guests || 1,
      specialRequests: body.specialRequests,
      status: "pending",
    }).returning();

    res.status(201).json(mapOrder(order));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to create order" });
  }
});

router.get("/orders/:orderId", async (req, res) => {
  try {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, req.params.orderId)).limit(1);
    if (!order) {
      res.status(404).json({ error: "not_found", message: "Order not found" });
      return;
    }
    res.json(mapOrder(order));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to get order" });
  }
});

router.patch("/orders/:orderId", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: "bad_request", message: "status is required" });
      return;
    }

    const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, req.params.orderId)).returning();
    if (!order) {
      res.status(404).json({ error: "not_found", message: "Order not found" });
      return;
    }
    res.json(mapOrder(order));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "internal_error", message: "Failed to update order" });
  }
});

export default router;

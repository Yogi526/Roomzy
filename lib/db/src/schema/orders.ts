import { integer, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull(),
  roomTitle: text("room_title").notNull(),
  roomAddress: text("room_address").notNull(),
  renterId: text("renter_id").notNull(),
  renterName: text("renter_name").notNull(),
  renterPhone: text("renter_phone").notNull(),
  ownerId: text("owner_id").notNull(),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out").notNull(),
  bookingType: text("booking_type", { enum: ["hourly", "daily"] }).notNull(),
  totalAmount: real("total_amount").notNull(),
  guests: integer("guests").notNull().default(1),
  specialRequests: text("special_requests"),
  status: text("status", { enum: ["pending", "accepted", "rejected", "cancelled", "completed"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ createdAt: true, status: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

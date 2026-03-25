import { boolean, integer, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomsTable = pgTable("rooms", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  ownerName: text("owner_name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull(),
  pricePerHour: real("price_per_hour").notNull(),
  pricePerDay: real("price_per_day").notNull(),
  roomType: text("room_type", { enum: ["private", "shared", "studio", "meeting"] }).notNull(),
  amenities: text("amenities").notNull().default("[]"),
  maxGuests: integer("max_guests").notNull().default(1),
  images: text("images").notNull().default("[]"),
  isAvailable: boolean("is_available").notNull().default(true),
  rating: real("rating"),
  totalReviews: integer("total_reviews").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({ createdAt: true, rating: true, totalReviews: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;

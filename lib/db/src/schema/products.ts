import { pgTable, text, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoryEnum = pgEnum("category", ["shoes", "tops", "bottoms", "accessories"]);
export const badgeEnum = pgEnum("badge", ["new", "sold"]);

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  name: text("name").notNull(),
  size: text("size").notNull(),
  price: integer("price").notNull(),
  category: categoryEnum("category").notNull(),
  caption: text("caption").notNull(),
  imageUrl: text("image_url").notNull(),
  badge: badgeEnum("badge"),
  telegramUrl: text("telegram_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

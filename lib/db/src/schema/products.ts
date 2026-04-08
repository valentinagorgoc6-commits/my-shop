import { pgTable, text, serial, integer, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoryEnum = pgEnum("category", ["shoes", "tops", "bottoms", "accessories", "supplements"]);
export const badgeEnum = pgEnum("badge", ["new", "sold", "reserved"]);

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  name: text("name").notNull(),
  size: text("size").notNull(),
  price: integer("price").notNull(),
  category: categoryEnum("category").notNull(),
  caption: text("caption").notNull().default(""),
  imageUrl: text("image_url").notNull(),
  imageUrls: text("image_urls"),
  badge: badgeEnum("badge"),
  telegramUrl: text("telegram_url").notNull(),
  featured: boolean("featured").notNull().default(false),
  sku: text("sku"),
  purchasePrice: integer("purchase_price"),
  avitoLink: text("avito_link"),
  gender: text("gender").notNull().default("women"),
  sortOrder: integer("sort_order"),
  published: boolean("published").notNull().default(false),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;

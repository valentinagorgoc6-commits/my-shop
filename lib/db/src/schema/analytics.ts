import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const pageViewsTable = pgTable("page_views", {
  id: serial("id").primaryKey(),
  page: text("page").notNull(),
  visitorId: text("visitor_id").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  device: text("device"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productClicksTable = pgTable("product_clicks", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  actionType: text("action_type").notNull(),
  visitorId: text("visitor_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

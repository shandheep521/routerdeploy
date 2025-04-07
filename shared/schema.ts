import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  address: text("address"),
  isAdmin: boolean("is_admin").default(false),
  isSeller: boolean("is_seller").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  phone: true,
  address: true,
  isSeller: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Category schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  itemCount: integer("item_count").default(0),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
  imageUrl: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Auction type enum
export const auctionTypeEnum = pgEnum('auction_type', ['traditional', 'reverse', 'sealed']);

// Product/Item schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  sellerId: integer("seller_id").notNull(),
  categoryId: integer("category_id").notNull(),
  initialPrice: doublePrecision("initial_price").notNull(),
  currentPrice: doublePrecision("current_price").notNull(),
  increment: doublePrecision("increment").notNull().default(10),
  auctionType: text("auction_type").notNull().default('traditional'),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  isSold: boolean("is_sold").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  bidCount: integer("bid_count").default(0),
  status: text("status").default('upcoming'), // upcoming, active, ended, sold
});

export const insertProductSchema = createInsertSchema(products).pick({
  title: true,
  description: true,
  imageUrl: true,
  sellerId: true,
  categoryId: true,
  initialPrice: true,
  currentPrice: true,
  increment: true,
  auctionType: true,
  startDate: true,
  endDate: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Bid schema
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  isAutoBid: boolean("is_auto_bid").default(false),
  maxAmount: doublePrecision("max_amount"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBidSchema = createInsertSchema(bids).pick({
  productId: true,
  userId: true,
  amount: true,
  isAutoBid: true,
  maxAmount: true,
  notes: true,
});

export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;

// Watchlist schema
export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWatchlistSchema = createInsertSchema(watchlists).pick({
  userId: true,
  productId: true,
});

export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type Watchlist = typeof watchlists.$inferSelect;

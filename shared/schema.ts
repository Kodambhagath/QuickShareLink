import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const shares = pgTable("shares", {
  id: varchar("id").primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  type: varchar("type", { enum: ["text", "url", "file"] }).notNull(),
  content: text("content").notNull(),
  fileName: varchar("file_name"),
  fileSize: integer("file_size"),
  password: varchar("password"),
  expiresAt: timestamp("expires_at").notNull(),
  oneTimeView: boolean("one_time_view").default(false).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey(),
  shareCode: varchar("share_code").notNull(),
  message: text("message").notNull(),
  userId: varchar("user_id").notNull(), // anonymous user identifier
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey(),
  shareCode: varchar("share_code").notNull().unique(),
  activeUsers: integer("active_users").default(0).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const privateChatSessions = pgTable("private_chat_sessions", {
  id: varchar("id").primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  activeUsers: integer("active_users").default(0).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const privateChatMessages = pgTable("private_chat_messages", {
  id: varchar("id").primaryKey(),
  chatCode: varchar("chat_code").notNull(),
  message: text("message").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const insertShareSchema = createInsertSchema(shares).omit({
  id: true,
  createdAt: true,
  viewCount: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
});

export const insertPrivateChatSessionSchema = createInsertSchema(privateChatSessions).omit({
  id: true,
  createdAt: true,
});

export const insertPrivateChatMessageSchema = createInsertSchema(privateChatMessages).omit({
  id: true,
  createdAt: true,
});

export type Share = typeof shares.$inferSelect;
export type InsertShare = z.infer<typeof insertShareSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type PrivateChatSession = typeof privateChatSessions.$inferSelect;
export type InsertPrivateChatSession = z.infer<typeof insertPrivateChatSessionSchema>;
export type PrivateChatMessage = typeof privateChatMessages.$inferSelect;
export type InsertPrivateChatMessage = z.infer<typeof insertPrivateChatMessageSchema>;

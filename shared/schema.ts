import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"), // active, paused, offline
  latitude: real("latitude"),
  longitude: real("longitude"),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  locationSharing: boolean("location_sharing").default(true).notNull(),
  pingEnabled: boolean("ping_enabled").default(true).notNull(),
  socketId: text("socket_id"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  memberId: integer("member_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // text, quick_message, ping
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pings = pgTable("pings", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  fromMemberId: integer("from_member_id").notNull(),
  toMemberId: integer("to_member_id"), // null for ping all
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  code: true,
  expiresAt: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  lastSeen: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertPingSchema = createInsertSchema(pings).omit({
  id: true,
  createdAt: true,
});

export const updateLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const updateMemberStatusSchema = z.object({
  status: z.enum(["active", "paused", "offline"]),
  locationSharing: z.boolean().optional(),
  pingEnabled: z.boolean().optional(),
});

export type Group = typeof groups.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Ping = typeof pings.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertPing = z.infer<typeof insertPingSchema>;
export type UpdateLocation = z.infer<typeof updateLocationSchema>;
export type UpdateMemberStatus = z.infer<typeof updateMemberStatusSchema>;

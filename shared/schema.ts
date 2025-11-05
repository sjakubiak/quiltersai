import { pgTable, text, varchar, integer, jsonb, timestamp, real, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Quilt Design Specifications
export const quiltSpecs = pgTable("quilt_specs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prompt: text("prompt").notNull(),
  widthIn: real("width_in").notNull(),
  heightIn: real("height_in").notNull(),
  sizeCategory: varchar("size_category", { length: 50 }), // baby, throw, twin, full, queen, king
  styleTags: text("style_tags").array(),
  palette: text("palette").array(), // hex colors
  budgetUsd: integer("budget_usd"),
  shapes: text("shapes").array(), // allowed shapes
  avoidShapes: text("avoid_shapes").array(),
  skillLevel: varchar("skill_level", { length: 50 }), // beginner, intermediate, advanced
  piecing: varchar("piecing", { length: 50 }), // machine, hand
  sashing: integer("sashing"), // boolean as 0/1
  borderIn: real("border_in").default(0),
  bindingBias: integer("binding_bias"), // boolean as 0/1
  prewash: integer("prewash"), // boolean as 0/1
  createdAt: timestamp("created_at").defaultNow(),
});

// Quilt Design Variations generated from a spec
export const designVariations = pgTable("design_variations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  specId: varchar("spec_id").references(() => quiltSpecs.id),
  name: text("name").notNull(),
  blockPattern: varchar("block_pattern", { length: 100 }), // Nine Patch, Log Cabin, etc.
  layoutStrategy: varchar("layout_strategy", { length: 100 }), // grid, brick, improv
  svgMockup: text("svg_mockup").notNull(), // SVG string
  previewPng: text("preview_png"), // base64 or URL
  difficulty: integer("difficulty").notNull(), // 1-5
  estimatedHours: real("estimated_hours"),
  scrapFriendly: integer("scrap_friendly"), // boolean
  totalYardage: real("total_yardage"),
  blockSizeIn: real("block_size_in"),
  sashingIn: real("sashing_in"),
  borderIn: real("border_in"),
  quiltingMotifs: text("quilting_motifs").array(),
  metadata: jsonb("metadata"), // additional layout params, colors used, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Cut list items for each design
export const cutListItems = pgTable("cut_list_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  designId: varchar("design_id").references(() => designVariations.id),
  fabricColor: text("fabric_color").notNull(), // hex or name
  pieceType: varchar("piece_type", { length: 100 }), // square, rectangle, strip, etc.
  widthIn: real("width_in").notNull(),
  heightIn: real("height_in").notNull(),
  quantity: integer("quantity").notNull(),
  yardage: real("yardage").notNull(),
  notes: text("notes"),
});

// Piecing steps for assembly
export const piecingSteps = pgTable("piecing_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  designId: varchar("design_id").references(() => designVariations.id),
  stepNumber: integer("step_number").notNull(),
  instruction: text("instruction").notNull(),
  diagramSvg: text("diagram_svg"), // SVG for this step
  type: varchar("type", { length: 50 }), // block_assembly, row_assembly, final_assembly
});

// Saved designs by users
export const savedDesigns = pgTable("saved_designs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  designId: varchar("design_id").references(() => designVariations.id),
  userId: varchar("user_id"), // optional user tracking
  savedAt: timestamp("saved_at").defaultNow(),
});

// Session storage table for Replit Auth
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - Merges Replit Auth fields with subscription management
// (IMPORTANT) Replit Auth fields are mandatory: id, email, firstName, lastName, profileImageUrl
export const users = pgTable("users", {
  // Replit Auth fields
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  
  // Subscription management fields
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  subscriptionTier: varchar("subscription_tier", { length: 20 }).notNull().default("FREE"), // FREE, HOBBY, PRO
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("active"), // active, canceled, past_due, incomplete
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Usage tracking for generation limits
// Note: userId can be either a user.id (for logged-in users) or a session ID (for anonymous users)
export const usageTracking = pgTable("usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // Can be user.id or session ID - no FK constraint to support both
  period: varchar("period", { length: 20 }).notNull(), // YYYY-MM-DD for daily, YYYY-MM for monthly
  periodType: varchar("period_type", { length: 10 }).notNull(), // daily, monthly
  generationCount: integer("generation_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feedback submissions
export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  category: varchar("category", { length: 50 }), // bug, feature, question, other
  status: varchar("status", { length: 20 }).notNull().default("new"), // new, read, replied, closed
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertQuiltSpecSchema = createInsertSchema(quiltSpecs).omit({
  id: true,
  createdAt: true,
});

export const insertDesignVariationSchema = createInsertSchema(designVariations).omit({
  id: true,
  createdAt: true,
});

export const insertCutListItemSchema = createInsertSchema(cutListItems).omit({
  id: true,
});

export const insertPiecingStepSchema = createInsertSchema(piecingSteps).omit({
  id: true,
});

export const insertSavedDesignSchema = createInsertSchema(savedDesigns).omit({
  id: true,
  savedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertUsageTrackingSchema = createInsertSchema(usageTracking).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

// Types
export type QuiltSpec = typeof quiltSpecs.$inferSelect;
export type InsertQuiltSpec = z.infer<typeof insertQuiltSpecSchema>;

export type DesignVariation = typeof designVariations.$inferSelect;
export type InsertDesignVariation = z.infer<typeof insertDesignVariationSchema>;

export type CutListItem = typeof cutListItems.$inferSelect;
export type InsertCutListItem = z.infer<typeof insertCutListItemSchema>;

export type PiecingStep = typeof piecingSteps.$inferSelect;
export type InsertPiecingStep = z.infer<typeof insertPiecingStepSchema>;

export type SavedDesign = typeof savedDesigns.$inferSelect;
export type InsertSavedDesign = z.infer<typeof insertSavedDesignSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert; // Required for Replit Auth

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// Additional TypeScript interfaces for API communication
export interface PromptInterpretRequest {
  prompt: string;
}

export interface PromptInterpretResponse {
  spec: {
    size: {
      width_in: number;
      height_in: number;
      category: string;
    };
    style_tags: string[];
    palette: string[];
    budget_usd?: number;
    constraints: {
      shapes?: string[];
      avoid?: string[];
    };
    skill_level: string;
    piecing: string;
    sashing: boolean;
    border: number;
    binding_bias: boolean;
    prewash: boolean;
  };
}

export interface GenerateDesignsRequest {
  spec: PromptInterpretResponse['spec'];
  count?: number;
}

export interface DesignWithDetails {
  design: DesignVariation;
  cutList: CutListItem[];
  steps: PiecingStep[];
  backing: {
    yardage: number;
    widthIn: number;
    heightIn: number;
    piecingPlan?: string;
  };
  batting: {
    widthIn: number;
    heightIn: number;
  };
  binding: {
    yardage: number;
    stripWidthIn: number;
    totalLengthIn: number;
  };
}

export interface PaletteExtractRequest {
  imageData: string; // base64
}

export interface PaletteExtractResponse {
  colors: string[]; // hex colors
}

export interface PresetsResponse {
  sizes: Array<{
    name: string;
    category: string;
    width_in: number;
    height_in: number;
  }>;
  wof_default: number;
  seam_allowance: number;
  binding_strip_width: number;
}

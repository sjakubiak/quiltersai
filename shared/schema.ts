import { pgTable, text, varchar, integer, jsonb, timestamp, real } from "drizzle-orm/pg-core";
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

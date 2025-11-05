import {
  type QuiltSpec,
  type InsertQuiltSpec,
  type DesignVariation,
  type InsertDesignVariation,
  type CutListItem,
  type InsertCutListItem,
  type PiecingStep,
  type InsertPiecingStep,
  type SavedDesign,
  type InsertSavedDesign,
  type User,
  type InsertUser,
  type UpsertUser,
  type UsageTracking,
  type InsertUsageTracking,
  type Feedback,
  type InsertFeedback,
  type DesignWithDetails,
  quiltSpecs,
  designVariations,
  cutListItems,
  piecingSteps,
  savedDesigns,
  users,
  usageTracking,
  feedback,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, asc, and } from "drizzle-orm";

export interface IStorage {
  // Quilt Specs
  createQuiltSpec(spec: InsertQuiltSpec): Promise<QuiltSpec>;
  getQuiltSpec(id: string): Promise<QuiltSpec | undefined>;

  // Design Variations
  createDesignVariation(design: InsertDesignVariation): Promise<DesignVariation>;
  getDesignVariation(id: string): Promise<DesignVariation | undefined>;
  getAllDesignVariations(): Promise<DesignVariation[]>;
  getDesignVariationsBySpecId(specId: string): Promise<DesignVariation[]>;

  // Cut List Items
  createCutListItem(item: InsertCutListItem): Promise<CutListItem>;
  getCutListItemsByDesignId(designId: string): Promise<CutListItem[]>;

  // Piecing Steps
  createPiecingStep(step: InsertPiecingStep): Promise<PiecingStep>;
  getPiecingStepsByDesignId(designId: string): Promise<PiecingStep[]>;

  // Saved Designs
  saveDesign(saved: InsertSavedDesign): Promise<SavedDesign>;
  getSavedDesigns(userId?: string): Promise<SavedDesign[]>;

  // Helper to get design with all details
  getDesignWithDetails(designId: string): Promise<DesignWithDetails | undefined>;

  // Users - Replit Auth required methods
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Users - Additional subscription methods
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserSubscription(userId: string, stripeCustomerId: string, stripeSubscriptionId: string, tier: string, status: string): Promise<User | undefined>;
  updateSubscriptionTier(userId: string, tier: string): Promise<User | undefined>;
  
  // Usage Tracking
  getOrCreateUsageTracking(userId: string, period: string, periodType: 'daily' | 'monthly'): Promise<UsageTracking>;
  incrementGenerationCount(userId: string, period: string, periodType: 'daily' | 'monthly'): Promise<UsageTracking>;
  getUsageForPeriod(userId: string, period: string, periodType: 'daily' | 'monthly'): Promise<UsageTracking | undefined>;
  
  // Feedback
  createFeedback(feedbackData: InsertFeedback): Promise<Feedback>;
  getAllFeedback(): Promise<Feedback[]>;
  getFeedbackById(id: string): Promise<Feedback | undefined>;
  updateFeedbackStatus(id: string, status: string): Promise<Feedback | undefined>;
}

export class MemStorage implements IStorage {
  private quiltSpecs: Map<string, QuiltSpec>;
  private designVariations: Map<string, DesignVariation>;
  private cutListItems: Map<string, CutListItem>;
  private piecingSteps: Map<string, PiecingStep>;
  private savedDesigns: Map<string, SavedDesign>;

  constructor() {
    this.quiltSpecs = new Map();
    this.designVariations = new Map();
    this.cutListItems = new Map();
    this.piecingSteps = new Map();
    this.savedDesigns = new Map();
  }

  // Quilt Specs
  async createQuiltSpec(insertSpec: InsertQuiltSpec): Promise<QuiltSpec> {
    const id = randomUUID();
    const spec: QuiltSpec = {
      ...insertSpec,
      id,
      createdAt: new Date(),
    };
    this.quiltSpecs.set(id, spec);
    return spec;
  }

  async getQuiltSpec(id: string): Promise<QuiltSpec | undefined> {
    return this.quiltSpecs.get(id);
  }

  // Design Variations
  async createDesignVariation(insertDesign: InsertDesignVariation): Promise<DesignVariation> {
    const id = randomUUID();
    const design: DesignVariation = {
      ...insertDesign,
      id,
      createdAt: new Date(),
    };
    this.designVariations.set(id, design);
    return design;
  }

  async getDesignVariation(id: string): Promise<DesignVariation | undefined> {
    return this.designVariations.get(id);
  }

  async getAllDesignVariations(): Promise<DesignVariation[]> {
    return Array.from(this.designVariations.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getDesignVariationsBySpecId(specId: string): Promise<DesignVariation[]> {
    return Array.from(this.designVariations.values())
      .filter((d) => d.specId === specId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  // Cut List Items
  async createCutListItem(insertItem: InsertCutListItem): Promise<CutListItem> {
    const id = randomUUID();
    const item: CutListItem = {
      ...insertItem,
      id,
    };
    this.cutListItems.set(id, item);
    return item;
  }

  async getCutListItemsByDesignId(designId: string): Promise<CutListItem[]> {
    return Array.from(this.cutListItems.values()).filter((item) => item.designId === designId);
  }

  // Piecing Steps
  async createPiecingStep(insertStep: InsertPiecingStep): Promise<PiecingStep> {
    const id = randomUUID();
    const step: PiecingStep = {
      ...insertStep,
      id,
    };
    this.piecingSteps.set(id, step);
    return step;
  }

  async getPiecingStepsByDesignId(designId: string): Promise<PiecingStep[]> {
    return Array.from(this.piecingSteps.values())
      .filter((step) => step.designId === designId)
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }

  // Saved Designs
  async saveDesign(insertSaved: InsertSavedDesign): Promise<SavedDesign> {
    const id = randomUUID();
    const saved: SavedDesign = {
      ...insertSaved,
      id,
      savedAt: new Date(),
    };
    this.savedDesigns.set(id, saved);
    return saved;
  }

  async getSavedDesigns(userId?: string): Promise<SavedDesign[]> {
    const designs = Array.from(this.savedDesigns.values());
    if (userId) {
      return designs.filter((d) => d.userId === userId);
    }
    return designs;
  }

  // Helper method
  async getDesignWithDetails(designId: string): Promise<DesignWithDetails | undefined> {
    const design = await this.getDesignVariation(designId);
    if (!design) return undefined;

    const cutList = await this.getCutListItemsByDesignId(designId);
    const steps = await this.getPiecingStepsByDesignId(designId);

    // Calculate backing, batting, and binding based on design specs
    // Assuming design metadata has quilt dimensions or we calculate from blocks
    const quiltWidth = 60; // Default, should come from spec
    const quiltHeight = 80;

    return {
      design,
      cutList,
      steps,
      backing: {
        yardage: ((quiltHeight + 8) / 36) * 2, // 4" overhang each side, doubled for piecing
        widthIn: quiltWidth + 8,
        heightIn: quiltHeight + 8,
        piecingPlan: "Horizontal seam at center",
      },
      batting: {
        widthIn: quiltWidth + 4,
        heightIn: quiltHeight + 4,
      },
      binding: {
        yardage: (((quiltWidth + quiltHeight) * 2 + 10) / 36) * 0.5,
        stripWidthIn: 2.5,
        totalLengthIn: (quiltWidth + quiltHeight) * 2 + 10,
      },
    };
  }

  // Users - Replit Auth required methods (stub implementations)
  async getUser(id: string): Promise<User | undefined> {
    return undefined;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    throw new Error("User management not supported in MemStorage");
  }

  // Users - Additional subscription methods (stub implementations)
  async getUserByEmail(email: string): Promise<User | undefined> {
    return undefined;
  }

  async updateUserSubscription(userId: string, stripeCustomerId: string, stripeSubscriptionId: string, tier: string, status: string): Promise<User | undefined> {
    return undefined;
  }

  async updateSubscriptionTier(userId: string, tier: string): Promise<User | undefined> {
    return undefined;
  }

  // Usage Tracking - Stub implementations
  async getOrCreateUsageTracking(userId: string, period: string, periodType: 'daily' | 'monthly'): Promise<UsageTracking> {
    throw new Error("Usage tracking not supported in MemStorage");
  }

  async incrementGenerationCount(userId: string, period: string, periodType: 'daily' | 'monthly'): Promise<UsageTracking> {
    throw new Error("Usage tracking not supported in MemStorage");
  }

  async getUsageForPeriod(userId: string, period: string, periodType: 'daily' | 'monthly'): Promise<UsageTracking | undefined> {
    return undefined;
  }

  // Feedback - Stub implementations
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    throw new Error("Feedback not supported in MemStorage");
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return [];
  }

  async getFeedbackById(id: string): Promise<Feedback | undefined> {
    return undefined;
  }

  async updateFeedbackStatus(id: string, status: string): Promise<Feedback | undefined> {
    return undefined;
  }
}

// PostgreSQL Database Storage
export class DbStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  // Quilt Specs
  async createQuiltSpec(insertSpec: InsertQuiltSpec): Promise<QuiltSpec> {
    const [spec] = await this.db.insert(quiltSpecs).values(insertSpec).returning();
    return spec;
  }

  async getQuiltSpec(id: string): Promise<QuiltSpec | undefined> {
    const [spec] = await this.db.select().from(quiltSpecs).where(eq(quiltSpecs.id, id));
    return spec;
  }

  // Design Variations
  async createDesignVariation(insertDesign: InsertDesignVariation): Promise<DesignVariation> {
    const [design] = await this.db.insert(designVariations).values(insertDesign).returning();
    return design;
  }

  async getDesignVariation(id: string): Promise<DesignVariation | undefined> {
    const [design] = await this.db.select().from(designVariations).where(eq(designVariations.id, id));
    return design;
  }

  async getAllDesignVariations(): Promise<DesignVariation[]> {
    return await this.db.select().from(designVariations).orderBy(desc(designVariations.createdAt));
  }

  async getDesignVariationsBySpecId(specId: string): Promise<DesignVariation[]> {
    return await this.db
      .select()
      .from(designVariations)
      .where(eq(designVariations.specId, specId))
      .orderBy(desc(designVariations.createdAt));
  }

  // Cut List Items
  async createCutListItem(insertItem: InsertCutListItem): Promise<CutListItem> {
    const [item] = await this.db.insert(cutListItems).values(insertItem).returning();
    return item;
  }

  async getCutListItemsByDesignId(designId: string): Promise<CutListItem[]> {
    return await this.db.select().from(cutListItems).where(eq(cutListItems.designId, designId));
  }

  // Piecing Steps
  async createPiecingStep(insertStep: InsertPiecingStep): Promise<PiecingStep> {
    const [step] = await this.db.insert(piecingSteps).values(insertStep).returning();
    return step;
  }

  async getPiecingStepsByDesignId(designId: string): Promise<PiecingStep[]> {
    return await this.db
      .select()
      .from(piecingSteps)
      .where(eq(piecingSteps.designId, designId))
      .orderBy(asc(piecingSteps.stepNumber));
  }

  // Saved Designs
  async saveDesign(insertSaved: InsertSavedDesign): Promise<SavedDesign> {
    const [saved] = await this.db.insert(savedDesigns).values(insertSaved).returning();
    return saved;
  }

  async getSavedDesigns(userId?: string): Promise<SavedDesign[]> {
    if (userId) {
      return await this.db.select().from(savedDesigns).where(eq(savedDesigns.userId, userId));
    }
    return await this.db.select().from(savedDesigns);
  }

  // Helper method
  async getDesignWithDetails(designId: string): Promise<DesignWithDetails | undefined> {
    const design = await this.getDesignVariation(designId);
    if (!design) return undefined;

    const cutList = await this.getCutListItemsByDesignId(designId);
    const steps = await this.getPiecingStepsByDesignId(designId);

    // Get the spec to determine quilt dimensions
    let quiltWidth = 60;
    let quiltHeight = 80;
    
    if (design.specId) {
      const spec = await this.getQuiltSpec(design.specId);
      if (spec) {
        quiltWidth = spec.widthIn;
        quiltHeight = spec.heightIn;
      }
    }

    return {
      design,
      cutList,
      steps,
      backing: {
        yardage: ((quiltHeight + 8) / 36) * 2,
        widthIn: quiltWidth + 8,
        heightIn: quiltHeight + 8,
        piecingPlan: "Horizontal seam at center",
      },
      batting: {
        widthIn: quiltWidth + 4,
        heightIn: quiltHeight + 4,
      },
      binding: {
        yardage: (((quiltWidth + quiltHeight) * 2 + 10) / 36) * 0.5,
        stripWidthIn: 2.5,
        totalLengthIn: (quiltWidth + quiltHeight) * 2 + 10,
      },
    };
  }

  // Users - Replit Auth required methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Users - Additional subscription methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUserSubscription(
    userId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    tier: string,
    status: string
  ): Promise<User | undefined> {
    const [user] = await this.db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionTier: tier,
        subscriptionStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateSubscriptionTier(userId: string, tier: string): Promise<User | undefined> {
    const [user] = await this.db
      .update(users)
      .set({
        subscriptionTier: tier,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Usage Tracking
  async getOrCreateUsageTracking(
    userId: string,
    period: string,
    periodType: 'daily' | 'monthly'
  ): Promise<UsageTracking> {
    // Try to get existing record
    const [existing] = await this.db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.period, period),
          eq(usageTracking.periodType, periodType)
        )
      );

    if (existing) {
      return existing;
    }

    // Create new record
    const [newRecord] = await this.db
      .insert(usageTracking)
      .values({
        userId,
        period,
        periodType,
        generationCount: 0,
      })
      .returning();

    return newRecord;
  }

  async incrementGenerationCount(
    userId: string,
    period: string,
    periodType: 'daily' | 'monthly'
  ): Promise<UsageTracking> {
    const record = await this.getOrCreateUsageTracking(userId, period, periodType);

    const [updated] = await this.db
      .update(usageTracking)
      .set({
        generationCount: record.generationCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(usageTracking.id, record.id))
      .returning();

    return updated;
  }

  async getUsageForPeriod(
    userId: string,
    period: string,
    periodType: 'daily' | 'monthly'
  ): Promise<UsageTracking | undefined> {
    const [record] = await this.db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.period, period),
          eq(usageTracking.periodType, periodType)
        )
      );

    return record;
  }

  // Feedback
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await this.db.insert(feedback).values(feedbackData).returning();
    return newFeedback;
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return await this.db.select().from(feedback).orderBy(desc(feedback.createdAt));
  }

  async getFeedbackById(id: string): Promise<Feedback | undefined> {
    const [result] = await this.db.select().from(feedback).where(eq(feedback.id, id));
    return result;
  }

  async updateFeedbackStatus(id: string, status: string): Promise<Feedback | undefined> {
    const [updated] = await this.db
      .update(feedback)
      .set({ status })
      .where(eq(feedback.id, id))
      .returning();
    return updated;
  }
}

// Use database storage instead of memory storage
export const storage = new DbStorage();

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
  type DesignWithDetails,
} from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export const storage = new MemStorage();

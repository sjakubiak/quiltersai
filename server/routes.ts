import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { interpretPrompt } from "./services/prompt-interpreter";
import { generateDesigns } from "./services/quilt-generator";
import type { PromptInterpretRequest, GenerateDesignsRequest } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  /**
   * POST /api/interpret
   * Interpret a natural language prompt into structured quilt specifications
   */
  app.post("/api/interpret", async (req, res) => {
    try {
      const { prompt } = req.body as PromptInterpretRequest;
      
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const result = await interpretPrompt(prompt);
      res.json(result);
    } catch (error) {
      console.error("Error interpreting prompt:", error);
      res.status(500).json({ error: "Failed to interpret prompt" });
    }
  });

  /**
   * POST /api/generate
   * Generate quilt design variations from a prompt
   */
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Interpret prompt
      const interpretation = await interpretPrompt(prompt);
      const spec = interpretation.spec;

      // Create spec in storage
      const savedSpec = await storage.createQuiltSpec({
        prompt,
        widthIn: spec.size.width_in,
        heightIn: spec.size.height_in,
        sizeCategory: spec.size.category,
        styleTags: spec.style_tags,
        palette: spec.palette,
        budgetUsd: spec.budget_usd,
        shapes: spec.constraints?.shapes || null,
        avoidShapes: spec.constraints?.avoid || null,
        skillLevel: spec.skill_level,
        piecing: spec.piecing,
        sashing: spec.sashing ? 1 : 0,
        borderIn: spec.border,
        bindingBias: spec.binding_bias ? 1 : 0,
        prewash: spec.prewash ? 1 : 0,
      });

      // Generate designs
      const count = 12;
      const variations = generateDesigns(spec, count);

      // Save all designs
      const savedDesigns = [];
      for (const variation of variations) {
        const design = await storage.createDesignVariation({
          ...variation.design,
          specId: savedSpec.id,
        });

        // Save cut list items
        for (const item of variation.cutList) {
          await storage.createCutListItem({
            ...item,
            designId: design.id,
          });
        }

        // Save piecing steps
        for (const step of variation.steps) {
          await storage.createPiecingStep({
            ...step,
            designId: design.id,
          });
        }

        savedDesigns.push(design);
      }

      res.json(savedDesigns);
    } catch (error) {
      console.error("Error generating designs:", error);
      res.status(500).json({ error: "Failed to generate designs" });
    }
  });

  /**
   * GET /api/designs
   * Get all design variations
   */
  app.get("/api/designs", async (req, res) => {
    try {
      const designs = await storage.getAllDesignVariations();
      res.json(designs);
    } catch (error) {
      console.error("Error fetching designs:", error);
      res.status(500).json({ error: "Failed to fetch designs" });
    }
  });

  /**
   * GET /api/designs/:id
   * Get a specific design with full details
   */
  app.get("/api/designs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const designWithDetails = await storage.getDesignWithDetails(id);

      if (!designWithDetails) {
        return res.status(404).json({ error: "Design not found" });
      }

      res.json(designWithDetails);
    } catch (error) {
      console.error("Error fetching design details:", error);
      res.status(500).json({ error: "Failed to fetch design details" });
    }
  });

  /**
   * POST /api/save
   * Save a design to user's collection
   */
  app.post("/api/save", async (req, res) => {
    try {
      const { designId, userId } = req.body;

      if (!designId) {
        return res.status(400).json({ error: "Design ID is required" });
      }

      const saved = await storage.saveDesign({
        designId,
        userId: userId || null,
      });

      res.json(saved);
    } catch (error) {
      console.error("Error saving design:", error);
      res.status(500).json({ error: "Failed to save design" });
    }
  });

  /**
   * GET /api/saved
   * Get all saved designs
   */
  app.get("/api/saved", async (req, res) => {
    try {
      const userId = req.query.userId as string | undefined;
      const savedDesigns = await storage.getSavedDesigns(userId);
      res.json(savedDesigns);
    } catch (error) {
      console.error("Error fetching saved designs:", error);
      res.status(500).json({ error: "Failed to fetch saved designs" });
    }
  });

  /**
   * POST /api/export/pdf
   * Export a design as PDF
   */
  app.post("/api/export/pdf", async (req, res) => {
    try {
      const { designId } = req.body;

      if (!designId) {
        return res.status(400).json({ error: "Design ID is required" });
      }

      // TODO: Implement PDF generation
      // For now, return a placeholder response
      res.json({ message: "PDF export coming soon", designId });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      res.status(500).json({ error: "Failed to export PDF" });
    }
  });

  /**
   * POST /api/palette/extract
   * Extract color palette from an uploaded image
   */
  app.post("/api/palette/extract", async (req, res) => {
    try {
      const { imageData } = req.body;

      if (!imageData) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // TODO: Implement palette extraction using color-thief or similar
      // For now, return sample palette
      const samplePalette = [
        "#008B8B",
        "#2F4F4F",
        "#FFFFFF",
        "#D6456B",
        "#FFB6C1",
      ];

      res.json({ colors: samplePalette });
    } catch (error) {
      console.error("Error extracting palette:", error);
      res.status(500).json({ error: "Failed to extract palette" });
    }
  });

  /**
   * GET /api/presets
   * Get size presets and default settings
   */
  app.get("/api/presets", async (req, res) => {
    try {
      const presets = {
        sizes: [
          { name: "Baby", category: "baby", width_in: 36, height_in: 42 },
          { name: "Throw", category: "throw", width_in: 54, height_in: 72 },
          { name: "Twin", category: "twin", width_in: 60, height_in: 80 },
          { name: "Full/Queen", category: "full", width_in: 90, height_in: 96 },
          { name: "King", category: "king", width_in: 108, height_in: 108 },
        ],
        wof_default: 42,
        seam_allowance: 0.25,
        binding_strip_width: 2.5,
      };

      res.json(presets);
    } catch (error) {
      console.error("Error fetching presets:", error);
      res.status(500).json({ error: "Failed to fetch presets" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

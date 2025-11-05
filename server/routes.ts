import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { interpretPrompt } from "./services/prompt-interpreter";
import { generateDesigns } from "./services/quilt-generator";
import { generateQuiltPDF } from "./services/pdf-export";
import type { PromptInterpretRequest, GenerateDesignsRequest } from "@shared/schema";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { TIER_FEATURES, canExportPdf } from "@shared/pricing";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  /**
   * GET /api/auth/user
   * Get the currently authenticated user
   */
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });


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
   * Export a design as PDF (requires HOBBY or PRO tier)
   */
  app.post("/api/export/pdf", isAuthenticated, async (req: any, res) => {
    try {
      const { designId } = req.body;

      if (!designId) {
        return res.status(400).json({ error: "Design ID is required" });
      }

      // Check user subscription tier
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !canExportPdf(user.subscriptionTier as any)) {
        return res.status(403).json({ 
          error: "PDF export requires a HOBBY or PRO subscription",
          tier: user?.subscriptionTier || "FREE"
        });
      }

      // Get design with all details
      const designDetails = await storage.getDesignWithDetails(designId);
      if (!designDetails) {
        return res.status(404).json({ error: "Design not found" });
      }

      // Generate PDF
      const pdfBuffer = await generateQuiltPDF(designDetails);

      // Set headers for file download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${designDetails.design.name.replace(/[^a-z0-9]/gi, "_")}_pattern.pdf"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);

      // Send PDF buffer
      res.send(pdfBuffer);
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

      // Use colorthief to extract palette
      // imageData should be a base64 data URI like "data:image/png;base64,..."
      const { getPalette } = await import("colorthief");
      
      // Remove data URI prefix to get just the base64
      const base64Data = imageData.split(',')[1] || imageData;
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Write to temp file for colorthief
      const fs = await import("fs");
      const path = await import("path");
      const os = await import("os");
      
      const tempFilePath = path.join(os.tmpdir(), `palette-${Date.now()}.png`);
      fs.writeFileSync(tempFilePath, buffer);
      
      // Extract palette using colorthief's direct function
      const palette = await getPalette(tempFilePath, 8);
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
      
      // Convert RGB arrays to hex strings
      const colors = palette.map((rgb: [number, number, number]) => {
        const [r, g, b] = rgb;
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      });

      res.json({ colors });
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

  /**
   * POST /api/subscription/create
   * Create or retrieve a Stripe subscription
   */
  app.post('/api/subscription/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tier } = req.body; // "HOBBY" or "PRO"

      if (!tier || (tier !== "HOBBY" && tier !== "PRO")) {
        return res.status(400).json({ error: "Invalid tier. Must be HOBBY or PRO." });
      }

      let user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If user already has an active subscription, return existing
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ['latest_invoice.payment_intent'],
        });
        
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          const invoice = subscription.latest_invoice as Stripe.Invoice;
          const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;
          
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: paymentIntent?.client_secret,
            status: subscription.status,
          });
        }
        
        // If subscription is incomplete, return it to resume payment
        if (subscription.status === 'incomplete') {
          const invoice = subscription.latest_invoice as Stripe.Invoice;
          const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;
          
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: paymentIntent?.client_secret,
            status: subscription.status,
          });
        }
      }

      // Get the Stripe Price ID for the tier
      const tierFeatures = TIER_FEATURES[tier];
      if (!tierFeatures.stripePriceId) {
        return res.status(500).json({ error: `Price ID not configured for ${tier} tier` });
      }

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
        
        // Only update customer ID, NOT the tier (tier upgrades only on payment success)
        const updatedUser = await storage.updateUserSubscription(
          userId,
          customerId,
          "", // No subscription ID yet
          user.subscriptionTier, // Keep current tier (FREE)
          user.subscriptionStatus || "active"
        );
        user = updatedUser || user;
      }

      // Create subscription with userId in metadata for webhook lookup
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: tierFeatures.stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: { userId, requestedTier: tier }, // Store for webhook
      });

      // Update user with subscription ID, but keep FREE tier until payment succeeds
      await storage.updateUserSubscription(
        userId,
        customerId,
        subscription.id,
        user.subscriptionTier, // Keep current tier (FREE)
        subscription.status // Will be "incomplete" initially
      );

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret,
        status: subscription.status,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: error.message || "Failed to create subscription" });
    }
  });

  /**
   * POST /api/subscription/cancel
   * Cancel a user's subscription
   */
  app.post('/api/subscription/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.stripeSubscriptionId) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await storage.updateUserSubscription(
        userId,
        user.stripeCustomerId!,
        user.stripeSubscriptionId,
        user.subscriptionTier,
        subscription.status
      );

      res.json({ 
        message: "Subscription will be canceled at period end",
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      });
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ error: error.message || "Failed to cancel subscription" });
    }
  });

  /**
   * POST /api/subscription/portal
   * Create Stripe Customer Portal session for managing billing
   */
  app.post('/api/subscription/portal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.status(404).json({ error: "No Stripe customer found" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/account`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: error.message || "Failed to create portal session" });
    }
  });

  /**
   * POST /api/webhooks/stripe
   * Handle Stripe webhook events
   * 
   * IMPORTANT: For production, set STRIPE_WEBHOOK_SECRET and verify signatures
   * to prevent webhook spoofing attacks.
   */
  app.post('/api/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
      // Verify webhook signature in production for security
      if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } else {
        // Development mode: accept without verification (INSECURE - dev only!)
        console.warn('⚠️  Webhook signature verification disabled - development mode only');
        event = req.body;
      }

      // Handle the event
      switch (event.type) {
        case 'invoice.payment_succeeded': {
          // Upgrade user to paid tier only when payment succeeds AND amount is paid
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.subscription as string;
          
          // Security: Verify actual payment was made (not $0 trial or forgiven invoice)
          const amountPaid = invoice.amount_paid || 0;
          const paymentIntentStatus = invoice.payment_intent 
            ? (typeof invoice.payment_intent === 'string' 
                ? null 
                : (invoice.payment_intent as Stripe.PaymentIntent).status)
            : null;
          
          // Only upgrade if payment > 0 OR payment intent succeeded (covers trials with setup)
          const isValidPayment = amountPaid > 0 || paymentIntentStatus === 'succeeded';
          
          if (!isValidPayment) {
            console.log(`⚠️  Skipping upgrade - no valid payment (amount: ${amountPaid}, status: ${paymentIntentStatus})`);
            break;
          }
          
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const userId = subscription.metadata.userId;
            const requestedTier = subscription.metadata.requestedTier;
            
            if (userId && requestedTier) {
              // Upgrade to the requested tier now that payment succeeded
              await storage.updateUserSubscription(
                userId,
                subscription.customer as string,
                subscription.id,
                requestedTier,
                subscription.status
              );
              console.log(`✅ Upgraded user ${userId} to ${requestedTier} tier (paid: $${amountPaid / 100})`);
            } else {
              // Fallback: determine tier from price ID
              const tierMap: Record<string, string> = {
                [TIER_FEATURES.HOBBY.stripePriceId!]: "HOBBY",
                [TIER_FEATURES.PRO.stripePriceId!]: "PRO",
              };
              
              const priceId = subscription.items.data[0]?.price.id;
              const tier = tierMap[priceId] || "FREE";
              
              if (userId && tier !== "FREE") {
                await storage.updateUserSubscription(
                  userId,
                  subscription.customer as string,
                  subscription.id,
                  tier,
                  subscription.status
                );
                console.log(`✅ Upgraded user ${userId} to ${tier} tier via price ID (paid: $${amountPaid / 100})`);
              }
            }
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log('❌ Payment failed:', invoice.id);
          break;
        }
        case 'customer.subscription.deleted': {
          // Downgrade user back to FREE when subscription is cancelled/deleted
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata.userId;
          
          if (userId) {
            await storage.updateUserSubscription(
              userId,
              subscription.customer as string,
              subscription.id,
              "FREE",
              "canceled"
            );
            console.log(`⬇️ Downgraded user ${userId} to FREE tier`);
          }
          break;
        }
        case 'customer.subscription.updated': {
          // Handle subscription status changes (e.g., past_due, active)
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata.userId;
          
          if (userId) {
            const tierMap: Record<string, string> = {
              [TIER_FEATURES.HOBBY.stripePriceId!]: "HOBBY",
              [TIER_FEATURES.PRO.stripePriceId!]: "PRO",
            };
            
            const priceId = subscription.items.data[0]?.price.id;
            const tier = subscription.status === 'active' || subscription.status === 'trialing'
              ? (tierMap[priceId] || "FREE")
              : "FREE"; // Downgrade if not active/trialing
            
            await storage.updateUserSubscription(
              userId,
              subscription.customer as string,
              subscription.id,
              tier,
              subscription.status
            );
            console.log(`🔄 Updated user ${userId} subscription: ${tier} (${subscription.status})`);
          }
          break;
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('Webhook error:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

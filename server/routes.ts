import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { interpretPrompt } from "./services/prompt-interpreter";
import { generateDesigns } from "./services/quilt-generator";
import { generateQuiltPDF } from "./services/pdf-export";
import { sendFeedbackEmail } from "./services/email";

// Extend session data to include usage tracking fields
declare module "express-session" {
  interface SessionData {
    initialized?: boolean;
  }
}
import type { PromptInterpretRequest, GenerateDesignsRequest } from "@shared/schema";
import { users, insertFeedbackSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { getServerTierFeatures, canExportPdf, SUBSCRIPTION_TIERS, type SubscriptionTier, getGenerationLimit } from "@shared/pricing";

// Get server-side tier features with Stripe Price IDs
const TIER_FEATURES = getServerTierFeatures();

// Use production keys in production, test keys in development
const isProduction = process.env.NODE_ENV === 'production';
const stripeSecretKey = isProduction 
  ? (process.env.STRIPE_SECRET_KEY || process.env.TESTING_STRIPE_SECRET_KEY)
  : (process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY);

if (!stripeSecretKey) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY or TESTING_STRIPE_SECRET_KEY');
}

const stripeMode = stripeSecretKey.startsWith('sk_test') ? 'TEST' : 'LIVE';
console.log('🔑 Stripe mode:', stripeMode, `(NODE_ENV: ${process.env.NODE_ENV || 'development'})`);

if (isProduction && stripeMode === 'TEST') {
  console.warn('⚠️  WARNING: Running in production with TEST Stripe keys!');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
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
   * GET /api/usage
   * Get current usage stats for the user
   */
  app.get("/api/usage", async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || req.sessionID;
      
      // Get user's subscription tier
      let tier: SubscriptionTier = SUBSCRIPTION_TIERS.FREE;
      if (user?.claims?.sub) {
        const dbUser = await storage.getUser(user.claims.sub);
        if (dbUser?.subscriptionTier && dbUser.subscriptionStatus === 'active') {
          tier = dbUser.subscriptionTier as SubscriptionTier;
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      const periodType = tier === SUBSCRIPTION_TIERS.FREE ? 'daily' : 'monthly';
      const period = periodType === 'daily' ? today : currentMonth;
      const isRegistered = !!user?.claims?.sub; // Check if user is logged in
      const limit = getGenerationLimit(tier, periodType, isRegistered);
      
      const usage = await storage.getUsageForPeriod(userId, period, periodType);
      const used = usage?.generationCount || 0;
      
      res.json({
        tier,
        limit,
        used,
        remaining: limit ? limit - used : null,
        periodType,
        period,
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ error: "Failed to fetch usage" });
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

      // Get user ID (authenticated user or anonymous session)
      const user = req.user as any;
      const userId = user?.claims?.sub || req.sessionID;
      
      // Ensure session exists for anonymous users
      if (!req.session.initialized) {
        req.session.initialized = true;
      }

      // Get user's subscription tier (default to FREE for anonymous/non-subscribed users)
      let tier: SubscriptionTier = SUBSCRIPTION_TIERS.FREE;
      if (user?.claims?.sub) {
        const dbUser = await storage.getUser(user.claims.sub);
        if (dbUser?.subscriptionTier && dbUser.subscriptionStatus === 'active') {
          tier = dbUser.subscriptionTier as SubscriptionTier;
        }
      }

      // Check usage limits
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      const periodType = tier === SUBSCRIPTION_TIERS.FREE ? 'daily' : 'monthly';
      const period = periodType === 'daily' ? today : currentMonth;
      const isRegistered = !!user?.claims?.sub; // Check if user is logged in
      
      const generationLimit = getGenerationLimit(tier, periodType, isRegistered);
      
      if (generationLimit !== null) {
        const usage = await storage.getUsageForPeriod(userId, period, periodType);
        const currentCount = usage?.generationCount || 0;
        
        if (currentCount >= generationLimit) {
          return res.status(429).json({
            error: "Generation limit reached",
            message: `You've reached your ${periodType} limit of ${generationLimit} designs. ${
              tier === SUBSCRIPTION_TIERS.FREE
                ? "Upgrade to generate more designs!"
                : "Your limit will reset next " + (periodType === 'daily' ? 'day' : 'month') + "."
            }`,
            limit: generationLimit,
            used: currentCount,
            tier,
            periodType,
          });
        }
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

      // Increment usage count after successful generation
      await storage.incrementGenerationCount(userId, period, periodType);

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
   * GET /api/stripe/config-check
   * Diagnostic endpoint to check Stripe configuration
   */
  app.get('/api/stripe/config-check', async (req, res) => {
    const hobbyPriceId = process.env.TESTING_STRIPE_PRICE_HOBBY || process.env.STRIPE_PRICE_HOBBY;
    const proPriceId = process.env.TESTING_STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_PRO;
    const secretKey = process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
    
    try {
      // Get account info to verify which Stripe account we're connected to
      let accountInfo = null;
      try {
        const account = await stripe.accounts.retrieve();
        accountInfo = {
          id: account.id,
          email: account.email,
          country: account.country,
          type: account.type
        };
      } catch (err: any) {
        accountInfo = { error: err.message };
      }
      
      let hobbyPriceDetails = null;
      let proPriceDetails = null;
      
      if (hobbyPriceId) {
        try {
          const price = await stripe.prices.retrieve(hobbyPriceId);
          hobbyPriceDetails = {
            id: price.id,
            active: price.active,
            currency: price.currency,
            unit_amount: price.unit_amount,
            recurring: price.recurring,
            product: price.product
          };
        } catch (err: any) {
          hobbyPriceDetails = { error: err.message };
        }
      }
      
      if (proPriceId) {
        try {
          const price = await stripe.prices.retrieve(proPriceId);
          proPriceDetails = {
            id: price.id,
            active: price.active,
            currency: price.currency,
            unit_amount: price.unit_amount,
            recurring: price.recurring,
            product: price.product
          };
        } catch (err: any) {
          proPriceDetails = { error: err.message };
        }
      }
      
      res.json({
        stripeMode: secretKey?.startsWith('sk_test') ? 'TEST' : 'LIVE',
        accountInfo,
        configured: {
          TESTING_STRIPE_SECRET_KEY: !!process.env.TESTING_STRIPE_SECRET_KEY,
          TESTING_STRIPE_PRICE_HOBBY: !!process.env.TESTING_STRIPE_PRICE_HOBBY,
          TESTING_STRIPE_PRICE_PRO: !!process.env.TESTING_STRIPE_PRICE_PRO,
          STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
          STRIPE_PRICE_HOBBY: !!process.env.STRIPE_PRICE_HOBBY,
          STRIPE_PRICE_PRO: !!process.env.STRIPE_PRICE_PRO,
        },
        priceIds: {
          hobby: hobbyPriceId || 'NOT_SET',
          pro: proPriceId || 'NOT_SET'
        },
        priceDetails: {
          hobby: hobbyPriceDetails,
          pro: proPriceDetails
        },
        diagnosis: !hobbyPriceDetails || hobbyPriceDetails.error 
          ? "⚠️ Price IDs don't exist in the connected Stripe account. Verify that your TESTING_STRIPE_SECRET_KEY and price IDs are from the SAME Stripe account."
          : "✅ All prices found successfully!"
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/subscription/create
   * Create or retrieve a Stripe subscription
   */
  app.post('/api/subscription/create', isAuthenticated, async (req: any, res) => {
    console.log('🚀 POST /api/subscription/create called');
    console.log('  Request body:', req.body);
    console.log('  User:', req.user?.claims?.sub || 'NO USER');
    
    try {
      const userId = req.user.claims.sub;
      const { tier } = req.body; // "HOBBY" or "PRO"

      console.log(`📝 Creating subscription for user ${userId}, tier: ${tier}`);

      if (!tier || (tier !== "HOBBY" && tier !== "PRO")) {
        console.error('❌ Invalid tier:', tier);
        return res.status(400).json({ error: "Invalid tier. Must be HOBBY or PRO." });
      }

      let user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If user already has an active subscription, return existing
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
        });
        
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          console.log('✅ User already has active subscription:', subscription.id);
          const invoice = subscription.latest_invoice as Stripe.Invoice;
          const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;
          
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: paymentIntent?.client_secret,
            status: subscription.status,
          });
        }
        
        // If subscription is incomplete, check if it has a valid payment intent
        if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
          console.log('⚠️ User has incomplete subscription:', subscription.id);
          const invoice = subscription.latest_invoice as Stripe.Invoice;
          const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;
          const setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent;
          
          // Check if we have a valid client secret from either intent
          const clientSecret = paymentIntent?.client_secret || setupIntent?.client_secret;
          
          if (clientSecret) {
            console.log('✅ Found existing client secret, resuming payment');
            return res.json({
              subscriptionId: subscription.id,
              clientSecret,
              intentType: paymentIntent?.client_secret ? 'payment' : 'setup',
              status: subscription.status,
            });
          }
          
          // No valid client secret - cancel old subscription and create new one
          console.log('❌ Incomplete subscription has no valid payment intent, canceling...');
          await stripe.subscriptions.cancel(subscription.id);
          console.log('✅ Old subscription canceled, will create new one');
        }
      }

      // Get the Stripe Price ID for the tier
      const tierFeatures = TIER_FEATURES[tier];
      console.log('🔍 Checking Stripe price configuration for tier:', tier);
      console.log('  - stripePriceId:', tierFeatures.stripePriceId);
      console.log('  - TESTING_STRIPE_PRICE_HOBBY:', process.env.TESTING_STRIPE_PRICE_HOBBY);
      console.log('  - TESTING_STRIPE_PRICE_PRO:', process.env.TESTING_STRIPE_PRICE_PRO);
      console.log('  - STRIPE_PRICE_HOBBY:', process.env.STRIPE_PRICE_HOBBY);
      console.log('  - STRIPE_PRICE_PRO:', process.env.STRIPE_PRICE_PRO);
      
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
      // Expand both payment_intent AND setup_intent (Stripe creates one or the other)
      console.log('📝 Creating Stripe subscription with:', {
        customer: customerId,
        priceId: tierFeatures.stripePriceId,
        tier,
        userId
      });
      
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: tierFeatures.stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card']
        },
        expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
        metadata: { userId, requestedTier: tier }, // Store for webhook
        collection_method: 'charge_automatically', // Ensure we charge immediately
      });
      
      console.log('✅ Stripe API returned subscription:', {
        id: subscription.id,
        status: subscription.status,
        latest_invoice_type: typeof subscription.latest_invoice,
        pending_setup_intent_type: typeof subscription.pending_setup_intent,
      });

      // Update user with subscription ID, but keep FREE tier until payment succeeds
      await storage.updateUserSubscription(
        userId,
        customerId,
        subscription.id,
        user.subscriptionTier, // Keep current tier (FREE)
        subscription.status // Will be "incomplete" initially
      );

      // Stripe creates EITHER a PaymentIntent OR SetupIntent depending on the subscription
      let invoice = subscription.latest_invoice as Stripe.Invoice;
      let paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;
      let setupIntent = subscription.pending_setup_intent as Stripe.SetupIntent;
      
      // If invoice exists but has no payment intent, try to finalize it
      if (invoice && typeof invoice === 'object' && !paymentIntent && invoice.status === 'draft') {
        console.log('⚠️ Invoice is in draft status, finalizing...');
        try {
          invoice = await stripe.invoices.finalizeInvoice(invoice.id, {
            expand: ['payment_intent'],
          });
          paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
          console.log('✅ Invoice finalized, PaymentIntent:', paymentIntent?.id || 'none');
        } catch (err: any) {
          console.error('❌ Failed to finalize invoice:', err.message);
        }
      }
      
      // If still no PaymentIntent or SetupIntent, create a SetupIntent manually
      // This happens when the subscription is created without an immediate payment requirement
      if (!paymentIntent?.client_secret && !setupIntent?.client_secret) {
        console.log('⚠️ No PaymentIntent or SetupIntent found, creating SetupIntent manually...');
        try {
          setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
            metadata: {
              userId,
              subscriptionId: subscription.id,
              requestedTier: tier,
            },
          });
          console.log('✅ SetupIntent created:', setupIntent.id);
        } catch (err: any) {
          console.error('❌ Failed to create SetupIntent:', err.message);
        }
      }
      
      let clientSecret: string | undefined;
      let intentType: 'payment' | 'setup' | undefined;
      
      if (paymentIntent?.client_secret) {
        clientSecret = paymentIntent.client_secret;
        intentType = 'payment';
      } else if (setupIntent?.client_secret) {
        clientSecret = setupIntent.client_secret;
        intentType = 'setup';
      }

      console.log('📋 Subscription created:', {
        subscriptionId: subscription.id,
        status: subscription.status,
        hasInvoice: !!invoice,
        invoiceStatus: typeof invoice === 'object' ? invoice.status : 'unknown',
        hasPaymentIntent: !!paymentIntent,
        hasSetupIntent: !!setupIntent,
        hasClientSecret: !!clientSecret,
        intentType: intentType || 'none',
        priceId: tierFeatures.stripePriceId,
      });

      if (!clientSecret) {
        console.error('❌ Missing client secret! Invoice:', invoice?.id, 'PaymentIntent:', paymentIntent?.id, 'SetupIntent:', setupIntent?.id);
        return res.status(500).json({ 
          error: "Failed to create payment intent. Please verify your Stripe configuration.",
          debug: {
            subscriptionId: subscription.id,
            status: subscription.status,
            invoiceId: typeof invoice === 'object' ? invoice.id : null,
            invoiceStatus: typeof invoice === 'object' ? invoice.status : null,
            paymentIntentId: paymentIntent?.id,
            setupIntentId: setupIntent?.id,
            priceId: tierFeatures.stripePriceId,
          }
        });
      }

      res.json({
        subscriptionId: subscription.id,
        clientSecret,
        intentType,
        status: subscription.status,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: error.message || "Failed to create subscription" });
    }
  });

  /**
   * POST /api/subscription/complete
   * Complete a subscription payment after SetupIntent succeeds
   * This is a backup for webhook delivery issues
   */
  app.post('/api/subscription/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { setupIntentId } = req.body;
      
      if (!setupIntentId) {
        return res.status(400).json({ error: "Missing setupIntentId" });
      }
      
      // Get the SetupIntent to retrieve subscription info
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      const subscriptionId = setupIntent.metadata?.subscriptionId;
      const paymentMethod = setupIntent.payment_method as string;
      
      console.log(`🔍 Retrieved SetupIntent:`, {
        id: setupIntent.id,
        status: setupIntent.status,
        hasPaymentMethod: !!paymentMethod,
        hasSubscriptionId: !!subscriptionId,
        metadata: setupIntent.metadata,
      });
      
      if (!subscriptionId) {
        return res.status(400).json({ 
          error: "Setup Intent missing subscription ID in metadata",
          debug: { setupIntentId, metadata: setupIntent.metadata }
        });
      }
      
      if (!paymentMethod) {
        return res.status(400).json({ 
          error: "SetupIntent missing payment method. Please complete the payment form.",
          debug: { setupIntentId, status: setupIntent.status }
        });
      }
      
      if (setupIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          error: `SetupIntent status is '${setupIntent.status}', expected 'succeeded'`,
          debug: { setupIntentId, status: setupIntent.status }
        });
      }
      
      console.log(`🔧 Completing subscription ${subscriptionId} for user ${userId}`);
      
      // 1. Get the subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Security check: Verify the subscription belongs to the authenticated user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      
      if (user.stripeCustomerId && subscription.customer !== user.stripeCustomerId) {
        console.error(`⚠️ Security: User ${userId} attempted to complete subscription ${subscriptionId} belonging to different customer`);
        return res.status(403).json({ 
          error: "This subscription does not belong to your account",
          debug: { userId, subscriptionCustomer: subscription.customer, userCustomer: user.stripeCustomerId }
        });
      }
      
      // 2. Attach payment method to customer (may already be attached)
      try {
        await stripe.paymentMethods.attach(paymentMethod, {
          customer: subscription.customer as string,
        });
      } catch (err: any) {
        // Ignore if already attached
        if (!err.message?.includes('already been attached')) {
          throw err;
        }
      }
      
      // 3. Set as default payment method
      await stripe.customers.update(subscription.customer as string, {
        invoice_settings: {
          default_payment_method: paymentMethod,
        },
      });
      
      // 4. Update the subscription with the payment method
      await stripe.subscriptions.update(subscriptionId, {
        default_payment_method: paymentMethod,
      });
      
      // 5. Pay the invoice
      const invoice = subscription.latest_invoice;
      if (invoice && typeof invoice === 'string') {
        const invoiceObj = await stripe.invoices.retrieve(invoice);
        if (invoiceObj.status !== 'paid') {
          await stripe.invoices.pay(invoice);
          console.log(`✅ Invoice ${invoice} paid successfully`);
        }
      }
      
      // 6. Get updated subscription status
      const updatedSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // 7. Upgrade user tier directly (don't rely on webhooks in test environment)
      if (updatedSubscription.status === 'active' || updatedSubscription.status === 'trialing') {
        const requestedTier = setupIntent.metadata.requestedTier || updatedSubscription.metadata.requestedTier;
        
        if (requestedTier && (requestedTier === 'HOBBY' || requestedTier === 'PRO')) {
          await storage.updateUserSubscription(
            userId,
            subscription.customer as string,
            subscriptionId,
            requestedTier,
            updatedSubscription.status
          );
          console.log(`✅ User ${userId} upgraded to ${requestedTier} tier (status: ${updatedSubscription.status})`);
        }
      }
      
      res.json({
        success: true,
        status: updatedSubscription.status,
        message: "Subscription completed successfully"
      });
    } catch (error: any) {
      console.error("Error completing subscription:", error);
      res.status(500).json({ error: error.message || "Failed to complete subscription" });
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
        case 'setup_intent.succeeded': {
          // When SetupIntent succeeds, attach payment method and pay the invoice
          const setupIntent = event.data.object as Stripe.SetupIntent;
          const subscriptionId = setupIntent.metadata?.subscriptionId;
          const userId = setupIntent.metadata?.userId;
          const paymentMethod = setupIntent.payment_method as string;
          
          console.log(`🔧 SetupIntent succeeded for user ${userId}, subscription ${subscriptionId}`);
          
          if (subscriptionId && paymentMethod) {
            try {
              // 1. Attach payment method to the customer
              const subscription = await stripe.subscriptions.retrieve(subscriptionId);
              await stripe.paymentMethods.attach(paymentMethod, {
                customer: subscription.customer as string,
              });
              
              // 2. Set as default payment method
              await stripe.customers.update(subscription.customer as string, {
                invoice_settings: {
                  default_payment_method: paymentMethod,
                },
              });
              
              // 3. Update the subscription with the payment method
              await stripe.subscriptions.update(subscriptionId, {
                default_payment_method: paymentMethod,
              });
              
              // 4. Get the latest invoice and pay it
              const invoice = subscription.latest_invoice;
              if (invoice && typeof invoice === 'string') {
                const invoiceObj = await stripe.invoices.retrieve(invoice);
                if (invoiceObj.status !== 'paid') {
                  await stripe.invoices.pay(invoice);
                  console.log(`✅ Invoice ${invoice} paid successfully for subscription ${subscriptionId}`);
                }
              }
            } catch (err: any) {
              console.error(`❌ Error processing SetupIntent for subscription ${subscriptionId}:`, err.message);
            }
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

  /**
   * POST /api/feedback
   * Submit user feedback
   */
  app.post("/api/feedback", async (req: any, res) => {
    try {
      const validation = insertFeedbackSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid feedback data", 
          details: validation.error.issues 
        });
      }

      // Add user ID if authenticated
      const feedbackData = {
        ...validation.data,
        userId: req.user?.claims?.sub || null,
      };

      const feedback = await storage.createFeedback(feedbackData);
      
      // Send email notification to sjakubiak@gmail.com
      await sendFeedbackEmail({
        name: feedbackData.name || undefined,
        email: feedbackData.email,
        subject: feedbackData.subject,
        message: feedbackData.message,
        category: feedbackData.category || undefined,
        userId: feedbackData.userId || undefined,
      });
      
      res.json({ success: true, id: feedback.id });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  /**
   * GET /api/feedback
   * Get all feedback (admin only - not protected yet)
   */
  app.get("/api/feedback", async (req, res) => {
    try {
      const feedbackList = await storage.getAllFeedback();
      res.json(feedbackList);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Subscription pricing tiers and feature flags

export const SUBSCRIPTION_TIERS = {
  FREE: "FREE",
  HOBBY: "HOBBY",
  PRO: "PRO",
} as const;

export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS];

export interface TierFeatures {
  name: string;
  priceMonthly: number;
  stripePriceId?: string; // Only populated server-side
  generationsPerDay?: number;
  generationsPerMonth?: number;
  pdfExport: boolean;
  zipExport: boolean;
  saveDesigns: boolean;
  commercialLicense: boolean;
  priorityQueue: boolean;
}

// Base tier features (safe for frontend)
export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  FREE: {
    name: "Free",
    priceMonthly: 0,
    generationsPerDay: 3, // 3/day for registered users, 1/day for anonymous (handled in getGenerationLimit)
    pdfExport: false,
    zipExport: false,
    saveDesigns: true,
    commercialLicense: false,
    priorityQueue: false,
  },
  HOBBY: {
    name: "Hobby",
    priceMonthly: 8,
    generationsPerMonth: 50,
    pdfExport: true,
    zipExport: false,
    saveDesigns: true,
    commercialLicense: false,
    priorityQueue: false,
  },
  PRO: {
    name: "Pro",
    priceMonthly: 18,
    generationsPerMonth: 500,
    pdfExport: true,
    zipExport: true,
    saveDesigns: true,
    commercialLicense: true,
    priorityQueue: true,
  },
};

// Server-side only: Inject Stripe Price IDs from environment
// This function should only be called on the backend
// Supports both testing and production price IDs
export function getServerTierFeatures(): Record<SubscriptionTier, TierFeatures> {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    ...TIER_FEATURES,
    HOBBY: {
      ...TIER_FEATURES.HOBBY,
      stripePriceId: isProduction
        ? (process.env.STRIPE_PRICE_HOBBY || process.env.TESTING_STRIPE_PRICE_HOBBY)
        : (process.env.TESTING_STRIPE_PRICE_HOBBY || process.env.STRIPE_PRICE_HOBBY),
    },
    PRO: {
      ...TIER_FEATURES.PRO,
      stripePriceId: isProduction
        ? (process.env.STRIPE_PRICE_PRO || process.env.TESTING_STRIPE_PRICE_PRO)
        : (process.env.TESTING_STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_PRO),
    },
  };
}

export function getTierFeatures(tier: SubscriptionTier): TierFeatures {
  return TIER_FEATURES[tier];
}

export function canExportPdf(tier: SubscriptionTier): boolean {
  return TIER_FEATURES[tier].pdfExport;
}

export function canExportZip(tier: SubscriptionTier): boolean {
  return TIER_FEATURES[tier].zipExport;
}

export function hasCommercialLicense(tier: SubscriptionTier): boolean {
  return TIER_FEATURES[tier].commercialLicense;
}

export function getGenerationLimit(
  tier: SubscriptionTier, 
  periodType: 'daily' | 'monthly',
  isRegistered: boolean = false
): number | null {
  const features = TIER_FEATURES[tier];
  if (periodType === 'daily') {
    // Registered users get 3/day, anonymous users get 1/day on FREE tier
    if (tier === SUBSCRIPTION_TIERS.FREE && features.generationsPerDay) {
      return isRegistered ? 3 : 1;
    }
    return features.generationsPerDay || null;
  }
  return features.generationsPerMonth || null;
}

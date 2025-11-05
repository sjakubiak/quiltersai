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
  stripePriceId?: string;
  generationsPerDay?: number;
  generationsPerMonth?: number;
  pdfExport: boolean;
  zipExport: boolean;
  saveDesigns: boolean;
  commercialLicense: boolean;
  priorityQueue: boolean;
}

export const TIER_FEATURES: Record<SubscriptionTier, TierFeatures> = {
  FREE: {
    name: "Free",
    priceMonthly: 0,
    generationsPerDay: 3,
    pdfExport: false,
    zipExport: false,
    saveDesigns: true,
    commercialLicense: false,
    priorityQueue: false,
  },
  HOBBY: {
    name: "Hobby",
    priceMonthly: 8,
    stripePriceId: process.env.STRIPE_PRICE_HOBBY,
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
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    generationsPerMonth: 500,
    pdfExport: true,
    zipExport: true,
    saveDesigns: true,
    commercialLicense: true,
    priorityQueue: true,
  },
};

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

export function getGenerationLimit(tier: SubscriptionTier, periodType: 'daily' | 'monthly'): number | null {
  const features = TIER_FEATURES[tier];
  if (periodType === 'daily') {
    return features.generationsPerDay || null;
  }
  return features.generationsPerMonth || null;
}

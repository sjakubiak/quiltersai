export interface DomainConfig {
  id: string;
  name: string;
  description: string;
  domain: string;
  
  terminology: {
    itemName: string;
    itemPlural: string;
    actionVerb: string;
    generateVerb: string;
    collectionName: string;
  };
  
  branding: {
    primaryColor: string;
    accentColor: string;
    logo?: string;
    favicon?: string;
    tagline: string;
    heroTitle: string;
    heroSubtitle: string;
  };
  
  features: {
    pdfExport: boolean;
    imageUpload: boolean;
    advancedOptions: boolean;
    communityGallery: boolean;
  };
  
  pricing: {
    currency: string;
    hobbyPrice: number;
    proPrice: number;
  };
  
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface DomainMetadata {
  version: string;
  author: string;
  license: string;
  categories: string[];
}

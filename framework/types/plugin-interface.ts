import type { DomainConfig } from './domain-config';

export interface PromptInterpretation {
  userPrompt: string;
  interpretedSpecs: Record<string, any>;
  confidence: number;
  suggestions?: string[];
}

export interface DesignOutput {
  id: string;
  name: string;
  preview: string;
  metadata: Record<string, any>;
  exportData: Record<string, any>;
}

export interface GenerationResult {
  designs: DesignOutput[];
  totalGenerated: number;
  processingTime: number;
}

export interface DomainPlugin {
  config: DomainConfig;
  
  interpretPrompt(prompt: string, options?: Record<string, any>): Promise<PromptInterpretation>;
  
  generateDesigns(
    interpretation: PromptInterpretation,
    count: number
  ): Promise<GenerationResult>;
  
  renderPreview(design: DesignOutput): Promise<string>;
  
  exportToPDF(design: DesignOutput): Promise<Buffer>;
  
  validateOptions?(options: Record<string, any>): boolean;
  
  extractPaletteFromImage?(imageBuffer: Buffer): Promise<string[]>;
}

export interface PluginContext {
  openai: any;
  storage: any;
  userId?: number;
  sessionId?: string;
}

import type {
  DomainPlugin,
  PromptInterpretation,
  DesignOutput,
  GenerationResult,
  PluginContext
} from '../../framework/types/plugin-interface';
import type { DomainConfig } from '../../framework/types/domain-config';
import config from './config.json';
import { interpretPrompt as legacyInterpretPrompt } from '../../server/services/prompt-interpreter';
import { generateDesigns as legacyGenerateDesigns } from '../../server/services/quilt-generator';
import { generateQuiltPDF } from '../../server/services/pdf-export';
import type { PromptInterpretResponse } from '../../shared/schema';

export default class QuiltingPlugin implements DomainPlugin {
  config: DomainConfig = config as DomainConfig;
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  async interpretPrompt(
    prompt: string,
    options?: Record<string, any>
  ): Promise<PromptInterpretation> {
    try {
      const result: PromptInterpretResponse = await legacyInterpretPrompt(prompt);
      
      return {
        userPrompt: prompt,
        interpretedSpecs: result.spec,
        confidence: 0.9,
        suggestions: result.suggestions
      };
    } catch (error) {
      console.error('Quilting prompt interpretation error:', error);
      throw new Error('Failed to interpret quilting prompt');
    }
  }

  async generateDesigns(
    interpretation: PromptInterpretation,
    count: number
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      const spec = interpretation.interpretedSpecs as PromptInterpretResponse["spec"];
      
      const legacyResults = legacyGenerateDesigns(spec, count);
      
      const designs: DesignOutput[] = legacyResults.map((result, index) => ({
        id: `quilt-${Date.now()}-${index}`,
        name: result.design.name,
        preview: result.design.svgMockup,
        metadata: {
          blockPattern: result.design.blockPattern,
          layoutStrategy: result.design.layoutStrategy,
          difficulty: result.design.difficulty,
          estimatedHours: result.design.estimatedHours,
          totalYardage: result.design.totalYardage,
          scrapFriendly: result.design.scrapFriendly,
          ...result.design.metadata
        },
        exportData: {
          design: result.design,
          cutList: result.cutList,
          steps: result.steps
        }
      }));

      return {
        designs,
        totalGenerated: designs.length,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Quilting design generation error:', error);
      throw new Error('Failed to generate quilt designs');
    }
  }

  async renderPreview(design: DesignOutput): Promise<string> {
    return design.preview;
  }

  async exportToPDF(design: DesignOutput): Promise<Buffer> {
    try {
      const exportData = design.exportData as {
        design: any;
        cutList: any[];
        steps: any[];
      };
      
      const pdfBuffer = await generateQuiltPDF(
        exportData.design,
        exportData.cutList,
        exportData.steps
      );
      
      return pdfBuffer;
    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error('Failed to export quilt PDF');
    }
  }

  validateOptions(options: Record<string, any>): boolean {
    return true;
  }

  async extractPaletteFromImage(imageBuffer: Buffer): Promise<string[]> {
    try {
      const ColorThief = (await import('colorthief')).default;
      const palette = await ColorThief.getPalette(imageBuffer);
      
      return palette.map((rgb: number[]) => {
        const r = rgb[0].toString(16).padStart(2, '0');
        const g = rgb[1].toString(16).padStart(2, '0');
        const b = rgb[2].toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      });
    } catch (error) {
      console.error('Color extraction error:', error);
      return [];
    }
  }
}

import type { 
  DomainPlugin, 
  PromptInterpretation, 
  DesignOutput, 
  GenerationResult,
  PluginContext 
} from '../../framework/types/plugin-interface';
import type { DomainConfig } from '../../framework/types/domain-config';
import config from './config.json';

export interface ConstructionSpec {
  projectType: string;
  dimensions: {
    width: number;
    height: number;
    length?: number;
    area: number;
  };
  style: string[];
  materials: string[];
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  features: string[];
  buildingCodes: string[];
  climateZone?: string;
}

export interface BlueprintDesign {
  id: string;
  name: string;
  projectType: string;
  style: string;
  floorPlan: string;
  elevations: string[];
  materials: MaterialItem[];
  costEstimate: CostBreakdown;
  specifications: string[];
  buildingSteps: BuildStep[];
  difficulty: number;
  estimatedDuration: string;
}

export interface MaterialItem {
  category: string;
  item: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  supplier?: string;
}

export interface CostBreakdown {
  materials: number;
  labor: number;
  permits: number;
  total: number;
  currency: string;
}

export interface BuildStep {
  phase: string;
  stepNumber: number;
  description: string;
  duration: string;
  requiredSkills: string[];
  safetyNotes?: string[];
}

export default class ConstructionPlugin implements DomainPlugin {
  config: DomainConfig = config as DomainConfig;
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  async interpretPrompt(
    prompt: string,
    options?: Record<string, any>
  ): Promise<PromptInterpretation> {
    const systemPrompt = `You are a construction design expert AI. Interpret the user's construction project description and extract structured specifications.
    
Return a JSON object with:
- projectType: (e.g., "Residential Home", "Deck", "Garage", "Addition", "Renovation")
- dimensions: {width, height, length, area} in feet/square feet
- style: array of architectural styles (e.g., ["Modern", "Craftsman", "Colonial"])
- materials: preferred materials (e.g., ["Wood Frame", "Brick", "Concrete"])
- budget: {min, max, currency} if mentioned
- features: specific features requested (e.g., ["Open Floor Plan", "2 Car Garage", "Master Suite"])
- buildingCodes: relevant building codes (e.g., ["IRC 2018", "Energy Star"])
- climateZone: if mentioned (e.g., "Zone 5")

User prompt: "${prompt}"
${options ? `\nAdditional options: ${JSON.stringify(options)}` : ''}`;

    try {
      const response = await this.context.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const interpretedSpecs = JSON.parse(response.choices[0].message.content || '{}');

      return {
        userPrompt: prompt,
        interpretedSpecs,
        confidence: 0.85,
        suggestions: [
          'Consider adding energy-efficient features',
          'Check local building codes and permits',
          'Factor in site preparation costs'
        ]
      };
    } catch (error) {
      console.error('Construction prompt interpretation error:', error);
      throw new Error('Failed to interpret construction prompt');
    }
  }

  async generateDesigns(
    interpretation: PromptInterpretation,
    count: number
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const spec = interpretation.interpretedSpecs as ConstructionSpec;
    
    const designs: DesignOutput[] = [];

    for (let i = 0; i < count; i++) {
      const design = await this.generateSingleBlueprint(spec, i);
      designs.push(design);
    }

    return {
      designs,
      totalGenerated: designs.length,
      processingTime: Date.now() - startTime
    };
  }

  private async generateSingleBlueprint(
    spec: ConstructionSpec,
    index: number
  ): Promise<DesignOutput> {
    const name = `${spec.projectType} Design ${String.fromCharCode(65 + index)}`;
    
    const materials = this.calculateMaterials(spec);
    const cost = this.estimateCost(materials);
    const steps = this.generateBuildSteps(spec);
    const floorPlan = this.generateFloorPlanSVG(spec);
    
    const blueprint: BlueprintDesign = {
      id: `blueprint-${Date.now()}-${index}`,
      name,
      projectType: spec.projectType,
      style: spec.style[0] || 'Modern',
      floorPlan,
      elevations: [],
      materials,
      costEstimate: cost,
      specifications: this.generateSpecifications(spec),
      buildingSteps: steps,
      difficulty: this.calculateDifficulty(spec),
      estimatedDuration: this.estimateDuration(spec)
    };

    return {
      id: blueprint.id,
      name: blueprint.name,
      preview: floorPlan,
      metadata: {
        projectType: blueprint.projectType,
        style: blueprint.style,
        difficulty: blueprint.difficulty,
        duration: blueprint.estimatedDuration,
        totalCost: cost.total
      },
      exportData: blueprint
    };
  }

  private calculateMaterials(spec: ConstructionSpec): MaterialItem[] {
    const area = spec.dimensions.area;
    
    return [
      {
        category: 'Framing',
        item: '2x4 Studs',
        quantity: Math.ceil(area / 16),
        unit: 'pieces',
        unitCost: 4.50,
        totalCost: Math.ceil(area / 16) * 4.50
      },
      {
        category: 'Sheathing',
        item: '4x8 Plywood Sheets',
        quantity: Math.ceil(area / 32),
        unit: 'sheets',
        unitCost: 45.00,
        totalCost: Math.ceil(area / 32) * 45.00
      },
      {
        category: 'Roofing',
        item: 'Asphalt Shingles',
        quantity: Math.ceil(area / 100),
        unit: 'squares',
        unitCost: 85.00,
        totalCost: Math.ceil(area / 100) * 85.00
      },
      {
        category: 'Foundation',
        item: 'Concrete',
        quantity: Math.ceil(area * 0.5),
        unit: 'cubic yards',
        unitCost: 120.00,
        totalCost: Math.ceil(area * 0.5) * 120.00
      }
    ];
  }

  private estimateCost(materials: MaterialItem[]): CostBreakdown {
    const materialsCost = materials.reduce((sum, item) => sum + item.totalCost, 0);
    const laborCost = materialsCost * 1.5;
    const permitsCost = materialsCost * 0.05;
    
    return {
      materials: Math.round(materialsCost),
      labor: Math.round(laborCost),
      permits: Math.round(permitsCost),
      total: Math.round(materialsCost + laborCost + permitsCost),
      currency: 'USD'
    };
  }

  private generateBuildSteps(spec: ConstructionSpec): BuildStep[] {
    return [
      {
        phase: 'Site Preparation',
        stepNumber: 1,
        description: 'Clear and level building site. Mark foundation boundaries.',
        duration: '1-2 days',
        requiredSkills: ['Basic Construction'],
        safetyNotes: ['Wear safety boots', 'Check for underground utilities']
      },
      {
        phase: 'Foundation',
        stepNumber: 2,
        description: 'Pour concrete foundation and allow to cure.',
        duration: '3-5 days',
        requiredSkills: ['Concrete Work'],
        safetyNotes: ['Wear gloves when handling concrete', 'Ensure proper ventilation']
      },
      {
        phase: 'Framing',
        stepNumber: 3,
        description: 'Construct wall frames and install roof trusses.',
        duration: '5-7 days',
        requiredSkills: ['Carpentry', 'Blueprint Reading'],
        safetyNotes: ['Use fall protection for roof work', 'Secure all scaffolding']
      },
      {
        phase: 'Exterior',
        stepNumber: 4,
        description: 'Install sheathing, roofing, and exterior finish.',
        duration: '4-6 days',
        requiredSkills: ['Roofing', 'Siding Installation']
      },
      {
        phase: 'Interior',
        stepNumber: 5,
        description: 'Install electrical, plumbing, insulation, and drywall.',
        duration: '10-14 days',
        requiredSkills: ['Electrical', 'Plumbing', 'Drywall']
      }
    ];
  }

  private generateSpecifications(spec: ConstructionSpec): string[] {
    return [
      `Project Type: ${spec.projectType}`,
      `Dimensions: ${spec.dimensions.width}' x ${spec.dimensions.length || spec.dimensions.height}'`,
      `Total Area: ${spec.dimensions.area} sq ft`,
      `Style: ${spec.style.join(', ')}`,
      `Foundation: Concrete slab with vapor barrier`,
      `Framing: 2x4 wood studs @ 16" O.C.`,
      `Insulation: R-19 walls, R-38 ceiling`,
      `Climate Zone: ${spec.climateZone || 'Standard'}`,
      `Building Code: IRC 2018 compliant`
    ];
  }

  private calculateDifficulty(spec: ConstructionSpec): number {
    let difficulty = 2;
    
    if (spec.dimensions.area > 1000) difficulty++;
    if (spec.features.length > 3) difficulty++;
    if (spec.projectType.includes('Renovation')) difficulty++;
    
    return Math.min(difficulty, 5);
  }

  private estimateDuration(spec: ConstructionSpec): string {
    const area = spec.dimensions.area;
    const weeks = Math.ceil(area / 200);
    return `${weeks}-${weeks + 2} weeks`;
  }

  private generateFloorPlanSVG(spec: ConstructionSpec): string {
    const width = Math.min(spec.dimensions.width * 10, 400);
    const height = Math.min((spec.dimensions.length || spec.dimensions.height) * 10, 400);
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#f8f9fa" stroke="#2563EB" stroke-width="3"/>
      <text x="${width/2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#2563EB">
        ${spec.projectType} - ${spec.dimensions.width}' x ${spec.dimensions.length || spec.dimensions.height}'
      </text>
      <rect x="20" y="50" width="${width - 40}" height="${height - 70}" fill="none" stroke="#6b7280" stroke-width="2" stroke-dasharray="5,5"/>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" font-size="14" fill="#6b7280">
        ${spec.dimensions.area} sq ft
      </text>
    </svg>`;
  }

  async renderPreview(design: DesignOutput): Promise<string> {
    return design.preview;
  }

  async exportToPDF(design: DesignOutput): Promise<Buffer> {
    throw new Error('PDF export not yet implemented for construction domain');
  }

  validateOptions(options: Record<string, any>): boolean {
    return true;
  }
}

# AI Design Framework

A configurable multi-domain framework for building AI-powered design generation platforms. Deploy separate instances for different industries (quilting, construction, music, architecture, etc.) with domain-specific branding and logic.

## Architecture

This framework follows a **plugin-based architecture** where each domain is a separate deployment with its own:
- Configuration (branding, terminology, pricing)
- Generation logic (AI prompts, calculations, output rendering)
- Domain-specific features

### Core Components

1. **Framework Core** (`framework/`)
   - Plugin interface and loader
   - Configuration system
   - Shared types

2. **Domain Modules** (`domains/`)
   - Each domain is self-contained
   - Implements the `DomainPlugin` interface
   - Includes `config.json` for branding/settings

3. **Shared Infrastructure**
   - Authentication (Replit Auth)
   - Subscription management (Stripe)
   - Usage tracking
   - Database (PostgreSQL)

## Deployment Model

**Separate Deployments Per Domain:**
```
quiltersai.com    → domains/quilting
builderai.com     → domains/construction
musicgenai.com    → domains/music
```

Each deployment:
- Runs independently
- Has its own DNS/domain
- Can be white-labeled for customers
- Shares the same codebase but loads different domain plugins

## Creating a New Domain

### 1. Create Domain Directory
```bash
mkdir -p domains/your-domain
```

### 2. Create Configuration (`domains/your-domain/config.json`)
```json
{
  "id": "your-domain",
  "name": "YourDomain AI",
  "description": "AI-powered design generator for...",
  "domain": "yourdomainai.com",
  "terminology": {
    "itemName": "design",
    "itemPlural": "designs",
    "actionVerb": "create",
    "generateVerb": "generate",
    "collectionName": "projects"
  },
  "branding": {
    "primaryColor": "#your-color",
    "accentColor": "#accent-color",
    "tagline": "Your tagline",
    "heroTitle": "Your Hero Title",
    "heroSubtitle": "Your subtitle..."
  },
  "features": {
    "pdfExport": true,
    "imageUpload": true,
    "advancedOptions": true,
    "communityGallery": false
  },
  "pricing": {
    "currency": "USD",
    "hobbyPrice": 10,
    "proPrice": 25
  },
  "seo": {
    "title": "Your SEO Title",
    "description": "Your meta description",
    "keywords": ["keyword1", "keyword2"]
  }
}
```

### 3. Implement Plugin (`domains/your-domain/plugin.ts`)

```typescript
import type { DomainPlugin, PluginContext } from '../../framework/types/plugin-interface';
import config from './config.json';

export default class YourDomainPlugin implements DomainPlugin {
  config = config;
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  async interpretPrompt(prompt: string, options?: Record<string, any>) {
    // Use OpenAI to interpret user prompt into structured specs
    const response = await this.context.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Your domain-specific system prompt...' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });
    
    return {
      userPrompt: prompt,
      interpretedSpecs: JSON.parse(response.choices[0].message.content),
      confidence: 0.9
    };
  }

  async generateDesigns(interpretation, count) {
    // Generate your domain-specific designs
    const designs = [];
    for (let i = 0; i < count; i++) {
      designs.push({
        id: `design-${i}`,
        name: `Design ${i}`,
        preview: await this.renderPreview(...),
        metadata: {...},
        exportData: {...}
      });
    }
    
    return {
      designs,
      totalGenerated: designs.length,
      processingTime: Date.now() - startTime
    };
  }

  async renderPreview(design) {
    // Generate SVG/PNG preview
    return '<svg>...</svg>';
  }

  async exportToPDF(design) {
    // Generate PDF export
    return Buffer.from(...);
  }
}
```

### 4. Deploy

Set environment variable and deploy:
```bash
export DOMAIN_ID=your-domain
npm run dev
```

## White-Label Configuration

To create a white-label instance:

1. Copy domain configuration
2. Update branding in `config.json`:
   - `name`, `domain`
   - `branding.primaryColor`, `branding.logo`
   - `seo` fields

3. Set customer-specific environment variables:
```bash
DOMAIN_ID=your-domain
STRIPE_PRICE_HOBBY=price_xxx_customer
STRIPE_PRICE_PRO=price_yyy_customer
```

## Domain Examples

### Quilting (Reference Implementation)
- **Domain**: quiltersai.com
- **Generates**: Quilt patterns with fabric calculations
- **Key Features**: Block patterns, yardage calculator, cut lists

### Construction (Example)
- **Domain**: builderai.com
- **Generates**: Construction blueprints with materials lists
- **Key Features**: Floor plans, cost estimates, building steps

## Environment Variables

Required for all deployments:
```
DOMAIN_ID=quilting
DATABASE_URL=postgresql://...
SESSION_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_PRICE_HOBBY=...
STRIPE_PRICE_PRO=...
```

## File Structure

```
/framework
  /types
    domain-config.ts      # Domain configuration schema
    plugin-interface.ts   # Plugin interface definitions
  /core
    plugin-loader.ts      # Dynamic plugin loader
    config-loader.ts      # Configuration loader

/domains
  /quilting
    config.json           # Quilting domain config
    plugin.ts             # Quilting plugin implementation
  /construction
    config.json           # Construction domain config
    plugin.ts             # Construction plugin implementation
  /[your-domain]
    config.json
    plugin.ts

/shared
  schema.ts               # Shared database schemas
  pricing.ts              # Pricing utilities

/server
  routes.ts               # Framework-aware API routes
  storage.ts              # Database storage layer

/client
  App.tsx                 # Framework-aware frontend
  [domain-aware components]
```

## Next Steps

1. ✅ Framework architecture created
2. ✅ Quilting domain extracted
3. ✅ Construction domain implemented
4. 🔄 Integrate framework into existing routes
5. 🔄 Update frontend to be domain-aware
6. 🔄 Test both domains
7. 🔄 Create deployment guide

# Quilter's AI

## Overview
Quilter's AI is an AI-powered quilt design generator that translates natural language prompts into comprehensive quilt patterns. It provides users with 10-12 unique design variations, including mockups, material estimates, cut lists, and assembly instructions. The project aims to simplify quilt design for quilters, offering a creative and efficient tool for generating patterns.

## User Preferences
- Theme: Light/Dark mode toggle (persists to localStorage)
- Default size presets
- Budget guidance
- Skill level filtering

## System Architecture
Quilter's AI utilizes a modern full-stack architecture. The frontend is built with React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query, and Wouter for routing. The backend is powered by Node.js, Express, and TypeScript, integrating with the OpenAI API for AI capabilities.

**Key Features:**
- Natural language prompt input with AI interpretation to structured quilt specifications.
- Generation of 10+ quilt block patterns and multiple layout strategies (grid, brick/coin strips, modern improv).
- SVG mockup previews and comprehensive quilt math (yardage, cut lists, binding, backing, batting).
- Design detail view with tabs (Overview, Cut List, Piecing Steps, Assembly Layout).
- Responsive design with dark mode support.
- API endpoints for prompt interpretation, design generation, retrieval, and saving.
- Block Library: Nine Patch, Four Patch, Log Cabin (straight & courthouse), Rail Fence, Irish Chain, Flying Geese, Plus Quilt, Coins/Bricks.
- Quilt Math Standards: 1/4″ seam allowance, 40-42″ usable WOF, specific calculations for binding, backing, batting, and yardage rounding to nearest 1/8 yard.
- Size Presets: Baby, Throw, Twin, Full/Queen, King.

**UI/UX Decisions:**
- **Colors**: Primary warm rose/pink (#D6456B) for a craft-friendly feel, with teal/aqua accents.
- **Typography**: Inter/DM Sans for headings, system UI stack for body, and JetBrains Mono for technical data.
- **Components**: Cards with elevation, badges, striped tables, tabs, and accordions for advanced options.

**Technical Implementations:**
- Schema-first approach with TypeScript interfaces for data models (QuiltSpec, DesignVariation, CutListItem, PiecingStep).
- Integration with OpenAI (via Replit AI Integrations) using the GPT-5 model.
- In-memory storage with a planned migration to PostgreSQL using Drizzle ORM for persistence.
- SVG generation for quilt mockups and comprehensive quilting math algorithms.
- PDF export capability for printable patterns.

## External Dependencies
- **OpenAI API**: Accessed via Replit AI Integrations for natural language processing and design generation.
- **Resend**: Email service used for sending feedback notifications.
- **Stripe**: Integrated for subscription management and secure payment processing.
- **PostgreSQL**: Persistent data storage using Drizzle ORM.
- **PDFKit**: Used for generating printable PDF quilt patterns.
- **ColorThief**: Library for extracting dominant colors from uploaded images.

## Multi-Domain Framework (NEW)

**Framework Architecture:**
- Converted from single-domain application to configurable multi-domain framework
- Plugin-based system allowing separate deployments for different industries
- Each domain has independent branding, terminology, generation logic, and pricing
- White-label ready for reselling to customers

**Current Domains:**
1. **Quilting** (`domains/quilting/`) - Original quilt pattern generator
2. **Construction** (`domains/construction/`) - BuilderAI for construction blueprints

**Framework Structure:**
```
framework/
  types/domain-config.ts     - Domain configuration schema
  types/plugin-interface.ts  - Plugin interface definitions
  core/plugin-loader.ts      - Dynamic plugin loading
  core/config-loader.ts      - Configuration management

domains/
  quilting/config.json       - Quilting branding & settings
  quilting/plugin.ts         - Quilt generation logic
  construction/config.json   - Construction branding & settings
  construction/plugin.ts     - Blueprint generation logic
```

**Deployment Model:**
- Single codebase, multiple deployments
- Set `DOMAIN_ID` environment variable to load specific domain
- Each deployment can have custom DNS (quiltersai.com, builderai.com)
- Separate Stripe pricing per domain
- Full white-label customization support

**Documentation:**
- `framework/README.md` - Framework architecture and domain creation guide
- `DEPLOYMENT.md` - Multi-domain deployment guide
- `WHITE_LABEL_GUIDE.md` - White-label configuration and pricing models

## Recent Changes

- **2025-11-06**: Stripe Configuration & Integration
  - ✅ Resolved account mismatch: TESTING_STRIPE_SECRET_KEY and price IDs now from same account (acct_1SQ7K3H2Aoyp5vFH)  
  - ✅ Price IDs verified: Hobby ($8/month) and Pro ($18/month) exist and working
  - ✅ Created /stripe-diagnostic page for real-time configuration verification
  - ⚠️ Current Issue: Subscription uses SetupIntent flow (correct for first-time subscriptions) but payment completion needs refinement
  - Implementation: 
    - Backend creates SetupIntent to collect payment method
    - Frontend confirms SetupIntent via Stripe Elements
    - Webhook handler processes setup_intent.succeeded to pay invoice
    - Backup endpoint /api/subscription/complete for manual completion
  - Status: Stripe Elements working, payment method collection working, invoice payment logic implemented
  - Remaining work: Test and verify webhook delivery OR refine manual completion flow

- **2025-11-06**: Multi-Domain Framework Implementation
  - Created configurable plugin architecture for multiple domains
  - Implemented Construction domain (BuilderAI) as proof-of-concept
  - Added comprehensive documentation for deployment and white-labeling
  - Framework supports independent deployments with custom branding
  - White-label ready for selling to customers

- **2025-11-06**: Comprehensive Mobile Responsiveness
  - Mobile-first design with proper stacking and responsive grids
  - All tap targets meet 44px minimum for accessibility
  - Full-screen modal experience on mobile devices
  - Zero horizontal overflow at all breakpoints
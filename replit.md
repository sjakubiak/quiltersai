# Quilter's AI

An AI-powered quilt design generator that transforms natural language prompts into complete quilt patterns with mockups, materials estimates, cut lists, and assembly instructions.

## Overview

Quilter's AI helps quilters design beautiful quilts by describing what they want in plain English. The application uses OpenAI (via Replit AI Integrations) to interpret user prompts and generates 10-12 unique design variations with comprehensive quilting specifications.

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS for styling
- shadcn/ui components
- React Query for data fetching
- Wouter for routing

### Backend
- Node.js + Express + TypeScript
- OpenAI API (via Replit AI Integrations)
- In-memory storage (MemStorage)
- SVG generation for quilt mockups
- Comprehensive quilting math algorithms

### AI Integration
- Uses Replit AI Integrations for OpenAI access
- No personal API key required
- Charges billed to Replit credits
- GPT-5 model for prompt interpretation

## Key Features

### Phase 1 (MVP - Current)
- ✅ Natural language prompt input with advanced options
- ✅ AI-powered prompt interpretation to structured quilt specifications
- ✅ Design generation with 10+ quilt block patterns
- ✅ SVG mockup previews
- ✅ Comprehensive quilt math (yardage, cut lists, binding, backing, batting)
- ✅ Multiple layout strategies (grid, brick/coin strips, modern improv)
- ✅ Design detail view with tabs (Overview, Cut List, Piecing Steps, Assembly Layout)
- ✅ Responsive design with dark mode support
- ✅ Beautiful loading and empty states

### Block Library (Implemented)
- Nine Patch
- Four Patch
- Log Cabin (straight & courthouse)
- Rail Fence
- Irish Chain
- Flying Geese
- Plus Quilt
- Coins/Bricks

### Layout Strategies
- Grid (uniform blocks)
- Brick/coin strips
- Modern improv (rectangular grids)
- Row-of-rows assembly

## Project Structure

```
/client
  /src
    /components
      - prompt-form.tsx          # Prompt input with advanced options
      - design-grid.tsx          # Grid display of generated designs
      - design-card.tsx          # Individual design card preview
      - design-detail.tsx        # Modal with full design details
      - quilt-overview.tsx       # Design overview tab
      - cut-list-table.tsx       # Fabric cutting requirements
      - piecing-steps.tsx        # Assembly instructions
      - feedback-form.tsx        # User feedback modal form
      - /ui                      # shadcn components
    /pages
      - home.tsx                 # Main application page
      - not-found.tsx            # 404 page
    /lib
      - queryClient.ts           # React Query configuration
    - App.tsx                    # Main app component
    - index.css                  # Global styles & design tokens
    - main.tsx                   # Entry point

/server
  - routes.ts                    # API endpoints
  - storage.ts                   # Data storage interface (PostgreSQL + in-memory fallback)
  - index.ts                     # Express server setup
  /services
    - email.ts                   # Resend email service for feedback notifications

/shared
  - schema.ts                    # TypeScript types & Drizzle schemas

design_guidelines.md             # Frontend design specifications
```

## Data Model

### QuiltSpec
- User prompt and interpreted specifications
- Size (width, height, category)
- Style tags, palette (hex colors)
- Budget, skill level, piecing method
- Shape constraints (allowed/avoided)
- Sashing, border, binding preferences

### DesignVariation
- Generated quilt design
- Block pattern & layout strategy
- SVG mockup & PNG preview
- Difficulty (1-5), estimated hours
- Total yardage, block dimensions
- Quilting motifs
- Metadata (colors used, layout params)

### CutListItem
- Fabric color (hex)
- Piece type (square, rectangle, strip)
- Dimensions with seam allowance
- Quantity & yardage per fabric

### PiecingStep
- Step-by-step assembly instructions
- Ordered by step number
- Optional diagram SVG
- Type (block_assembly, row_assembly, final_assembly)

## Quilt Math Standards

- **Seam Allowance**: 1/4″ (standard quilting)
- **WOF (Width of Fabric)**: 40-42″ usable width
- **Binding**: Perimeter + 10% for mitering, 2.5″ strips
- **Backing**: Quilt top + 4-6″ overhang per side
- **Batting**: Quilt top + 2-4″ overhang per side
- **Yardage Rounding**: To nearest 1/8 yard

## Size Presets

- **Baby**: 36″ × 42″
- **Throw**: 54″ × 72″
- **Twin**: 60″ × 80″
- **Full/Queen**: 90″ × 96″
- **King**: 108″ × 108″

## API Endpoints

- `POST /api/interpret` - Interpret natural language prompt
- `POST /api/generate` - Generate design variations
- `GET /api/designs` - Get all generated designs
- `GET /api/designs/:id` - Get specific design with details
- `POST /api/export/pdf` - Export design as PDF
- `POST /api/save` - Save design to collection
- `GET /api/saved` - Get saved designs

## Design System

### Colors
- **Primary**: Warm rose/pink (#D6456B) - craft-friendly, inviting
- **Accent**: Teal/Aqua for highlights
- **Charts**: Coordinated palette for fabric visualization

### Typography
- **Headings**: Inter / DM Sans - clean, modern
- **Body**: System UI stack for readability
- **Monospace**: JetBrains Mono for measurements & technical data

### Components
- Cards with subtle elevation on hover
- Badges for tags and metadata
- Tables with striped rows for cut lists
- Tabs for organizing design information
- Accordion for collapsible advanced options

## User Preferences

- Theme: Light/Dark mode toggle (persists to localStorage)
- Default size presets
- Budget guidance
- Skill level filtering

## Future Enhancements (Phase 2+)

- PDF export with printable templates
- ZIP export (PDFs + SVGs + CSV cut list)
- Image palette extraction from uploaded photos
- Additional block patterns (Bear Paw, Churn Dash, Carpenter's Star, etc.)
- Medallion & on-point layout strategies
- Foundation Paper Piecing (FPP) templates
- PostgreSQL database for persistence
- User authentication and saved designs
- Design sharing and community gallery
- Custom fabric pricing and stash management
- Batch design comparison tools

## Development

The application follows a schema-first approach with horizontal batching:
1. Define all data models and TypeScript interfaces
2. Build all frontend components with exceptional visual quality
3. Implement backend API and business logic
4. Connect frontend to backend with proper error handling

## MVP Status

**Completed Features:**
- ✅ Natural language prompt interpretation with OpenAI GPT-5
- ✅ AI-powered design generation (12 variations per prompt)
- ✅ 9 quilt block patterns implemented (Nine Patch, Four Patch, Log Cabin, Rail Fence, Irish Chain, Flying Geese, Plus Quilt, Coins, Bricks)
- ✅ Multiple layout strategies (grid, brick, coin-stack, modern-improv, row-by-row)
- ✅ Comprehensive quilt math (yardage, cut lists, binding, backing, batting)
- ✅ Design grid with beautiful card previews
- ✅ Design detail modal with tabs (Overview, Cut List, Piecing Steps, Assembly Layout)
- ✅ Save designs to collection
- ✅ Dark mode support with theme toggle
- ✅ Responsive design for desktop and tablet
- ✅ Beautiful loading, empty, and error states
- ✅ All core user journeys tested and working

**Phase 2 Features (Future):**
- PDF export with printable templates and instructions
- ZIP export with all assets (PDFs + SVGs + CSV)
- Image palette extraction from uploaded photos
- Additional block patterns (Bear Paw, Churn Dash, Carpenter's Star, etc.)
- Medallion and on-point layout strategies
- PostgreSQL database for persistence
- User authentication
- Design sharing and community gallery

## Recent Changes

- **2025-11-06**: Signup Incentive System Implementation
  - **Tiered Free Limits**: Registered FREE users get 5 designs/day (vs. 3/day for anonymous users)
  - **SignupIncentiveBanner Component**: Prominent dismissible banner on home page for anonymous users highlighting account benefits (5/day, permanent saves, design history)
  - **Multi-Touchpoint Messaging**: 
    - Home page: SignupIncentiveBanner with clear value proposition and CTAs
    - Usage Indicator: Shows signup prompt for anonymous users near limit, upgrade prompt for registered users
    - Pricing Page: Callout highlighting free account benefits (5/day, no credit card required)
  - **Backend Logic**: getGenerationLimit() now accepts isRegistered parameter, correctly enforced in both /api/usage and /api/generate
  - **UX Balance**: Respectful "continue as guest" option, dismissible with localStorage persistence
  - **Value Messaging**: 67% more designs (5 vs 3) for simply creating a free account
  - Architect-reviewed and approved for production

- **2025-11-06**: Comprehensive Conversion Rate Optimization (CRO)
  - **Enhanced Pricing Page**: Added social proof (5,000+ users), customer testimonials, trust signals (30-day money-back guarantee), and compelling value propositions
  - **Improved CTAs**: Action-oriented button copy ("Start 30-Day Trial", "Upgrade to Hobby →", "Unlock 50 Designs/Month - $8")
  - **Strategic Upgrade Prompts**: Modal appears after 2nd/3rd generation for FREE users with benefits comparison, pricing highlight, and urgency messaging
  - **Usage Indicator Enhancement**: Clear value propositions in upgrade CTAs with price anchoring ("Less than 2 yards of fabric")
  - **Psychology-Driven Elements**: Leverages social proof, urgency, scarcity, anchoring, and risk reversal
  - **Design Compliance**: All emojis replaced with lucide-react icons (AlertCircle, Sparkles, Check, Flame, Zap) per design guidelines
  - Architect-reviewed and approved for production

- **2025-11-05**: Usage Limit Enforcement System
  - **Tier-Based Limits**: FREE (3/day), HOBBY (50/month), PRO (500/month)
  - **Anonymous Tracking**: Session-based tracking for non-logged-in users
  - **Database Schema**: Modified usage_tracking table to accept both user IDs and session IDs
  - **API Endpoints**: POST /api/generate enforces limits, GET /api/usage shows current stats
  - **Frontend Display**: UsageIndicator component shows progress, remaining count, and upgrade prompts
  - **Error Handling**: Returns 429 status with helpful messages when limits exceeded
  - **Security**: Session-based tracking for anonymous users, no data leaks
  - End-to-end testing passed for FREE tier (3 designs per day)

- **2025-11-05**: Feedback System Implementation
  - **Database Schema**: Added feedback table with fields for name, email, category, subject, message, userId, and status
  - **API Endpoint**: POST /api/feedback with Zod validation and error handling
  - **Email Integration**: Resend email service sends notifications to sjakubiak@gmail.com
  - **Security**: HTML escaping to prevent injection attacks, secure handling of user input
  - **UI Component**: Beautiful modal feedback form with category dropdown (bug, feature, question, other)
  - **Header Integration**: "Send Feedback" button accessible from main navigation
  - End-to-end testing passed with security validation

- **2025-11-05**: Complete Subscription System Implementation
  - **Stripe Integration**: Full subscription system with three tiers (FREE, HOBBY $8/mo, PRO $18/mo)
  - **Secure Payment Flow**: Users remain on FREE tier until webhook confirms payment, preventing free upgrades
  - **Invoice Validation**: Webhook validates invoice.amount_paid > 0 before upgrading tier (prevents $0 trials/forgiven invoices)
  - **Frontend Pages**: Pricing page (/pricing), Subscribe page (/subscribe?tier=TIER), Account page (/account) with billing portal
  - **Tier Gates**: PDF export restricted to paid tiers, usage limits enforced per tier
  - **Auth Integration**: Replit Auth with profile display, tier badges, and navigation
  - **Query Parameter Fix**: Subscribe page correctly parses tier from URL for both HOBBY and PRO
  - **Frontend Safety**: Separated client-safe pricing constants from server-only Stripe Price IDs to prevent process.env errors
  - **PostgreSQL Sessions**: Migrated from memory store to connect-pg-simple for reliable session persistence
  - End-to-end subscription testing passed successfully

- **2025-11-03**: Major Feature Updates
  - **Database Migration**: Migrated from in-memory to PostgreSQL with Drizzle ORM, all data persists across restarts
  - **PDF Export**: Complete printable quilt pattern PDFs with cut lists, piecing instructions, calibration square, and material summaries using PDFKit
  - **Image Palette Extraction**: Upload photos to extract 5-8 dominant colors using ColorThief library, integrated into prompt form with visual color badges
  - Fixed backing/batting calculations to use actual spec dimensions
  - End-to-end testing validates all new features

- **2025-01-03**: Complete MVP implementation
  - All data schemas and TypeScript interfaces
  - Beautiful frontend with exceptional visual quality
  - OpenAI integration for prompt interpretation
  - Quilt generator with 9 block patterns and 5 layout strategies
  - Comprehensive quilt math calculations
  - All API endpoints (generate, designs, save, export placeholder)
  - End-to-end testing passed successfully
  - Save functionality fully working
  - Export PDF infrastructure in place (full implementation in Phase 2)

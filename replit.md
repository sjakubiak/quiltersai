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
- Design detail view with tabs (Overview, Cut List, Piecing Steps, Assembly Layout, Buy Supplies).
- **Favorites System**: Users can save favorite designs for quick access later.
- **Social Media Sharing**: Pre-generated captions and share buttons for Pinterest, Facebook, and Twitter.
- **Affiliate Marketing**: Curated supply recommendations with affiliate links (Amazon Associates, fabric retailers).
- Responsive design with dark mode support.
- API endpoints for prompt interpretation, design generation, retrieval, saving, and favorites.
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

## Subscription Tiers & Usage Limits

**Generation Limits:**
- **Anonymous Users** (not logged in): 1 design per day
- **FREE Tier** (registered users): 3 designs per day
- **HOBBY Tier** ($8 CAD/month): 50 designs per month + PDF export
- **PRO Tier** ($18 CAD/month): 500 designs per month + PDF/ZIP export + commercial license

**PDF Export:**
- Available for HOBBY and PRO tiers only
- Implemented via `/api/export/pdf` endpoint
- Checks subscription tier using `canExportPdf()` function
- Returns 403 error for FREE tier users
- Generates printable pattern with PDFKit library

## Recent Changes

- **2025-11-06**: Updated Usage Limits
  - Changed anonymous user limit from 3 to 1 design per day
  - Changed registered FREE tier from 5 to 3 designs per day
  - HOBBY and PRO tiers remain unchanged
  - Updated pricing page to reflect new limits
  - Verified PDF export functionality for subscribed users

- **2025-11-06**: Subscription Page Fixes
  - Added 30-second timeout protection to prevent infinite loading
  - Improved error handling with automatic redirect to pricing on failure
  - Fixed incomplete subscription cleanup (cancels broken old subscriptions)
  - Better error messages for common issues (unauthorized, timeout, missing client secret)

- **2025-11-06**: Stripe Subscription Flow - COMPLETE ✅
  - ✅ Resolved account mismatch: All Stripe keys and price IDs from same account (acct_1SQ7K3H2Aoyp5vFH)
  - ✅ Price IDs verified and working: Hobby ($8/month) and Pro ($18/month)
  - ✅ Created /stripe-diagnostic page for real-time configuration verification
  - ✅ Complete end-to-end subscription flow implemented and tested
  - **Implementation Details:**
    - Backend creates SetupIntent with Stripe Elements for payment collection
    - Frontend confirms SetupIntent via stripe.confirmSetup()
    - Stripe redirects to /account with setup_intent parameter
    - Account page calls /api/subscription/complete to finalize subscription
    - Backend attaches payment method, pays invoice, and upgrades user tier
    - User immediately sees upgraded tier (HOBBY/PRO) with active status
  - **Enhanced Features:**
    - useAuth hook now exposes refetch() and logout() methods
    - Comprehensive error handling with user-friendly toast notifications
    - Redirect status checking for failed payments
    - Direct tier upgrade (doesn't rely on webhooks in test environment)
  - **Testing:** End-to-end Playwright tests confirm successful subscription activation

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

- **2025-11-07**: Affiliate Marketing & Social Media Sharing
  - **Social Media Integration:**
    - Added share dialog with pre-generated captions and quilting hashtags
    - Platform-specific share buttons (Pinterest, Facebook, Twitter)
    - Copy-to-clipboard functionality for captions and design links
    - Share button integrated into design detail modal header
  - **Affiliate Marketing:**
    - New "Buy Supplies" tab in design detail with curated supply recommendations
    - Affiliate links for fabric retailers (Fat Quarter Shop, Missouri Star)
    - Amazon Associates links for batting, thread, cutting tools, and quilting supplies
    - Transparent disclosure about affiliate partnerships
    - PDF exports now include "Buy Supplies" page with clickable affiliate links
  - **Implementation Details:**
    - Created `shared/affiliate-config.ts` with centralized affiliate link management
    - `SocialShare` component generates platform-specific URLs with encoded parameters
    - `BuySupplies` component displays organized supply categories with descriptions
    - All affiliate links tagged with `rel="noopener noreferrer sponsored"` for SEO
    - PDF export enhanced with dedicated supplies page including Amazon and retailer links

- **2025-11-07**: Bot Detection & WordPress Scanner Blocking
  - **Bot Detection Analytics:**
    - Comprehensive bot scoring system (0-100+ scale) analyzing every HTTP request
    - Detection signals: User-Agent patterns, rate limiting, missing headers, header ordering, platform mismatches
    - SQL-optimized analytics dashboard at `/analytics` (requires authentication)
    - Summary metrics: total requests, unique IPs, average bot score, high-risk IP rankings
    - Database schema with indexes on IP, timestamp, and bot score for performance
  - **WordPress Scanner Blocking:**
    - Automatic detection of WordPress scanner paths: `wp-login`, `wp-admin`, `wp-content`, `xmlrpc.php`, `.php` files
    - WordPress scanners get +80 bot score (very high risk)
    - Blocked requests immediately return 404 "Not Found" to waste scanner time
    - All blocked attempts logged in analytics for monitoring
  - **Implementation:**
    - `server/middleware/bot-detection.ts` - Middleware with scoring algorithm and blocking logic
    - `server/storage.ts` - SQL aggregation for efficient analytics queries using `COUNT`, `AVG`, `GROUP BY`
    - `client/src/pages/analytics.tsx` - Admin dashboard with authentication requirement
    - API endpoints `/api/analytics/summary` and `/api/analytics/requests` secured with `isAuthenticated` middleware
    - Bot score filtering uses `gte` (greater-than-or-equal) for threshold queries
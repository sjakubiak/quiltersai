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
- **PostgreSQL**: Planned for persistent data storage, replacing current in-memory storage.
- **PDFKit**: Used for generating printable PDF quilt patterns.
- **ColorThief**: Library for extracting dominant colors from uploaded images.
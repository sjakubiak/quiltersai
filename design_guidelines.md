# Quilter's AI Design Guidelines

## Design Approach

**Hybrid Creative-Utility System**

This application bridges creative exploration with technical precision, requiring a design that feels inspiring yet functional. Taking inspiration from:
- **Canva**: Approachable creative tools with clear visual hierarchy
- **Linear**: Clean data presentation and modern aesthetics
- **Notion**: Balance of beauty and information density

**Core Design Principles:**
1. **Visual Hierarchy**: Separate creative exploration (quilt previews) from technical data (cut lists, yardage)
2. **Breathing Room**: Generous spacing around quilt mockups to showcase designs without distraction
3. **Precision First**: Technical information must be scannable, accurate, and printable
4. **Craft-Friendly**: Interface should feel warm and approachable for the quilting community

---

## Typography

**Font Families:**
- **Primary (Headings & UI)**: Inter or DM Sans - clean, modern, highly legible
- **Secondary (Body/Data)**: System UI stack for optimal readability in tables and lists
- **Monospace (Measurements)**: JetBrains Mono for cut lists and dimensions

**Hierarchy:**
- **H1 (App Title)**: 2.5rem (40px), semibold
- **H2 (Section Headers)**: 1.75rem (28px), semibold
- **H3 (Card Titles)**: 1.25rem (20px), medium
- **Body**: 1rem (16px), regular
- **Small (Metadata)**: 0.875rem (14px), regular
- **Technical Data**: 0.875rem (14px), monospace for measurements

---

## Layout System

**Spacing Scale (Tailwind Units):**
Use consistent spacing primitives: **2, 3, 4, 6, 8, 12, 16, 20, 24**

- **Micro spacing**: p-2, gap-3 (component internals)
- **Component spacing**: p-4, p-6 (cards, containers)
- **Section spacing**: py-12, py-16 (desktop), py-8 (mobile)
- **Major sections**: py-20, py-24 (landing zones)

**Grid Systems:**
- **Design Grid**: 2 columns (md), 3 columns (lg), 4 columns (xl) for design cards
- **Detail View**: 2-column split at lg breakpoint (60/40 for preview/details)
- **Tables**: Full-width with horizontal scroll on mobile

**Container Widths:**
- **Main content**: max-w-7xl (1280px)
- **Detail panels**: max-w-6xl (1152px)
- **Text content**: max-w-prose (65ch)

---

## Component Library

### Navigation & Chrome
**Header:**
- Fixed top navigation with app logo/title on left
- Search/filter controls in center (on results page)
- User actions (Save, Export) on right
- Height: h-16, subtle border bottom

**Left Panel (Prompt Input):**
- Width: w-80 (320px) on desktop, full-width drawer on mobile
- Sticky positioning during scroll
- Contains: prompt textarea, advanced toggles (collapsible), generate button
- Padding: p-6, gap-6 between sections

### Core UI Elements

**Design Cards:**
- Aspect ratio 4:3 for preview mockup
- Preview occupies 65% of card height
- Metadata footer: size, yardage, difficulty (compact stats row)
- Hover: subtle elevation increase
- Padding: p-4, gap-3

**Prompt Input:**
- Large textarea: min-h-32, rounded corners
- Character counter below
- Advanced toggles: accordion sections with gap-4

**Primary Button (Generate):**
- Full-width in panel
- Height: h-12
- Prominent, rounded-lg
- Loading state with spinner

### Data Display

**Cut List Table:**
- Striped rows for readability
- Columns: Fabric, Quantity, Size, Total Yardage
- Monospace font for measurements
- Sticky header on scroll
- Compact row height (h-10)

**Stats Display:**
- Badge-style pills for tags (skill level, style)
- Icon + value pairs for quick metrics
- Grid layout: grid-cols-2 md:grid-cols-4

**Tabs (Detail View):**
- Horizontal tabs at top
- Active state: border-bottom accent
- Height: h-12, gap-8 between tabs

### Forms & Inputs

**Color Palette Picker:**
- Circular color swatches: w-10 h-10
- Grid display: grid-cols-5 md:grid-cols-8
- Add color button at end
- Selected state: ring accent

**Toggles & Checkboxes:**
- Standard size: w-5 h-5
- Labels: font-medium, adjacent with gap-2
- Group spacing: gap-4 vertically

**Range Sliders (Budget, Size):**
- Full-width with value display
- Tick marks at presets
- Height: h-2

### Overlays & Modals

**Design Detail Modal:**
- Full-screen on mobile
- Max-w-6xl centered on desktop
- Close button: top-right, size w-10 h-10
- Content padding: p-6 md:p-8

**Export Options:**
- Dropdown or modal with checkboxes
- Preview of export contents
- Action buttons: gap-3

### Data Visualization

**SVG Mockup Viewer:**
- Container: aspect-[4/3] or aspect-square
- Zoom controls: bottom-right corner
- Grid toggle for alignment reference
- Pan/zoom interactions

**Block Diagrams:**
- Small scale: w-24 h-24 for thumbnails
- Large scale: w-full max-w-md for instructions
- Grid overlay option

**Assembly Layout:**
- Step indicators: numbered circles
- Arrow connectors between steps
- Highlight active step

### Special Components

**Palette Extractor:**
- Image upload zone: h-40, dashed border
- Extracted colors: display as row of swatches below
- Apply to design button

**Difficulty Indicator:**
- 5-star or 1-5 scale visualization
- Icon + text label
- Size: h-5 icons

**Time Estimate:**
- Clock icon + range (e.g., "8-12 hours")
- Small, compact display

**Quilting Motif Overlays:**
- SVG patterns overlaid on mockup
- Toggle on/off
- Opacity control

---

## Images

**Hero Section (Landing Page):**
Large hero image showcasing a finished quilt or quilting process
- Position: Full-width banner, h-[500px] on desktop, h-[300px] mobile
- Overlay: Semi-transparent gradient with white text and call-to-action
- Content: Centered headline "Design Your Perfect Quilt with AI" + subtitle + CTA button with blurred background

**Design Card Previews:**
SVG-generated quilt mockups (not photos)
- Render as PNG previews for performance
- Background: neutral to showcase design

**Example Designs (Demo Section):**
3 pre-generated example quilts with different styles
- Display: 3-column grid (lg), 1-column (mobile)
- Each with small caption describing style

**Palette Inspiration:**
Optional gallery of inspiration images for palette extraction
- 4-6 example images in grid
- Overlay: "Extract Palette" button with blurred background on hover

**Empty States:**
Illustration or icon for "No saved designs" or "Start by entering a prompt"
- Simple, friendly line art style
- Centered in container with gap-4 below for action button
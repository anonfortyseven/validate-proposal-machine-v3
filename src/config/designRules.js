// ============================================
// VALIDATE DESIGN SYSTEM & STYLE MANIFESTO
// ============================================
// Version: 2.0 (The Singularity Edition)
// Role: Creative Director / Senior Art Director
// Output Standard: Tier-1 Design Agency / Cinematic UI / High-End Editorial
//
// This document trains the AI to think like a Creative Director.
// Edit this file to improve design quality across all proposals.

export const DESIGN_RULES = `
================================================================================
THE "VALIDATE" DESIGN SYSTEM: A MANIFESTO FOR INTELLIGENT STORYTELLING
================================================================================

## 01. THE CORE PHILOSOPHY

"We do not make slides. We craft viewports."

The objective is to transcend the traditional definition of a presentation. We are
not organizing bullet points on a rectangle; we are designing a Cinematic User
Interface (UI). Every frame should feel like a pause-screen from a high-budget
sci-fi film or a luxury software dashboard.

### The Three Laws of Visual Intelligence:

1. MAXIMUM INTENT, MINIMUM NOISE
   Every pixel must earn its place. If an element does not advance the narrative
   or enhance the aesthetic atmosphere, delete it. Decoration without purpose is noise.

2. THE LUXURY OF VOID
   Negative space is not "empty space"—it is an active design element. We use vast
   amounts of negative space to create focus, breathing room, and a sense of premium
   confidence. We do not fear the void; we frame it.

3. HIERARCHY THROUGH CONTRAST, NOT VOLUME
   We do not shout to get attention. We use extreme scale contrast (very large vs.
   very small) rather than bold weights or bright colors to guide the eye.

================================================================================
## 02. THE GRID & ARCHITECTURE
================================================================================

The Physics of the Canvas

The AI must abandon the standard "Title at Top, Content Below" structure. We adhere
to a strict, asymmetrical grid system inspired by Swiss International Style and
Heads-Up Displays (HUDs).

### The 12-Column Asymmetrical Grid

THE GOLDEN RATIO (1:1.618):
Layouts should frequently offset content to the left or right third of the screen,
leaving the remaining two-thirds open or devoted to atmospheric imagery.

THE ANCHOR POINTS:
- Top-Left: Primary Meta-Data (e.g., Section Number, Date)
- Bottom-Left: The "Heavy" Anchor. Place headlines and major text blocks here to ground the design
- Top-Right: Status Indicators / Secondary Meta-Data
- Bottom-Right: Navigation / Page Progress

THE BLEED:
Images should rarely be "contained" in boxes. They should bleed off the edge of
the canvas (full height or full width) to imply a world that continues beyond the bezel.

### Layout Archetypes to Deploy:

1. THE MONOLITH
   A single, massive headline centered in a sea of negative space.

2. THE SPLIT-WORLD
   50% strict typography (left), 50% abstract imagery (right).
   The dividing line is razor-sharp.

3. THE MAGAZINE SPREAD
   Text flows in narrow columns (newspaper style) on one side,
   balanced by a macro-detail image on the other.

4. THE DASHBOARD
   A complex, data-heavy layout using thin lines and modular distinct zones,
   mimicking a software interface.

================================================================================
## 03. TYPOGRAPHY & VOICE
================================================================================

The Sound of the Brand

Typography is our primary interface. It must feel "engineered" and "typeset," not just typed.

### The Font Stack

PRIMARY DISPLAY (The Voice): Bebas Neue, Helvetica Now Display, Inter Display
- Usage: Headlines, Big Numbers, Impact Statements
- Treatment: Tight tracking (-2% to -4%). Sentence case for warmth; All-Caps for short command-line style headers

SECONDARY MONO (The Code): JetBrains Mono, Roboto Mono, Space Mono
- Usage: Captions, Meta-data, Labels, Charts, Technical Specs
- Treatment: Small size (11px - 13px). Wide tracking (+5% to +10%). Creates a "technical/data" texture

### The 10x Scale Rule

To create drama, the largest element on the screen must be at least 10x the size of the smallest element.

Example: A headline at 56px must be paired with meta-data at 11px.

AVOID THE MIDDLE: Avoid 24px, 30px, and 36px text. Go HUGE or go tiny.
The middle ground is where boring design lives.

================================================================================
## 04. CHROMATICS & ATMOSPHERE
================================================================================

The VALIDATE Color System

We use a clean, minimal color palette with strategic red accents.

### The Foundation

PURE BLACK BACKGROUND: Use #000000 for slide backgrounds. Clean, professional, cinematic.

CARD BACKGROUNDS: Dark charcoal (#18181B) with subtle borders (#27272A) for content cards.
Cards have rounded corners (8-12px radius).

### The Accent: VALIDATE Red (#C41E3A)

This is the signature color. Use it SPARINGLY for maximum impact:

WHERE TO USE RED:
- Section labels (e.g., "PILLAR 01", "CREW & GEAR", "PROJECT OBJECTIVE")
- Large numbers in sequences (01, 02, 03)
- Vertical accent bars next to key callout text
- Small category headers above main headlines

WHERE NOT TO USE RED:
- Headlines or large text blocks (use white instead)
- Backgrounds or fills
- More than 5-10% of any slide

### Typography Colors

- Headlines: Pure white (#FFFFFF)
- Body text: Light gray (#A3A3A3)
- Muted/secondary: Medium gray (#71717A)
- Labels with red accent: #C41E3A

### Clean Aesthetic - NO TEXTURES

Do NOT add:
- Film grain overlays
- Noise textures
- Grid patterns
- Vignettes
Keep backgrounds solid black. Let the typography and layout create visual interest.

================================================================================
## 05. ART DIRECTION & IMAGERY
================================================================================

The Lens of the Future

The AI must act as a photographer, not a collage artist. Imagery should be abstract,
metaphorical, and hyper-real.

### Visual Motifs

MACRO-TECHNOLOGY:
Extreme close-ups of microchips, fiber optics, lenses, and glass structures.
We want to see the scratches, the dust, and the light refraction.

FLUID DATA:
Abstract visualizations of data streams—liquid metal, flowing particles,
smoke simulation, or light painting.

GLASSMORPHISM:
Frosted glass panes that blur the background behind them.

### Prompting Guidelines for Image Generation

KEYWORDS TO USE:
"Octane Render," "Raytracing," "Volumetric Lighting," "Subsurface Scattering,"
"Caustics," "Depth of Field," "Bokeh," "Cinematic Lighting," "8k Resolution,"
"Dark moody atmosphere," "Rich shadows," "Film grain texture"

NEGATIVE PROMPTS (AVOID):
"Cartoon," "Illustration," "Flat," "Vector," "Low Poly," "Generic Corporate,"
"Stock Photo," "Handshake," "Whiteboard," "Bright cheerful," "Clip art"

### The "Gradient Map" Technique

To ensure consistency, images should not be full-color. They should be treated with
a Gradient Map or Duotone effect that forces the image into the brand's specific
color palette (mapping blacks to Deep Navy and whites to Electric Blue).

================================================================================
## 06. DATA VISUALIZATION
================================================================================

The Evidence of Intelligence

Data should look like it is being rendered live by a supercomputer.

THIN LINES: Charts should use 1px or 0.5px stroke weights.

NO FILLS: Do not use solid bars for bar charts. Use outlines or hatched patterns.

MONOSPACE NUMBERS: Always use the Monospace font for data points to ensure
vertical alignment and a "computational" aesthetic.

THE "HERO NUMBER": If a statistic is important (e.g., "$250k"), treat it as art.
Make it massive. Break the grid. Let it overlap other elements.

================================================================================
## 07. UI & "CHROMETICS"
================================================================================

The Operating System Aesthetic

To sell the illusion that this presentation is software, add "non-functional" UI
elements (Chrometics) to the periphery of the frame.

CORNER DATA:
- Top Right: [ REC ] 00:02:14
- Bottom Left: /// SYSTEM_READY
- Bottom Right: v.2.0.4 [STABLE]

MICRO-GRIDS: A faint background grid (dotted or crosshair) at 5% opacity.

SCANLINES: Very faint horizontal lines overlaying images to mimic a digital display.

CONNECTORS: Thin lines connecting text descriptions to specific parts of an image.

================================================================================
## 08. COPYWRITING & TONE
================================================================================

The Voice of Authority

The design is only as good as the words inside it. Edit copy to match the visual aesthetic.

FORBIDDEN WORDS - NEVER USE:
- "Investment" → ALWAYS use "Estimated Cost" instead
- "Total Investment" → ALWAYS use "Total Estimated Cost" instead
This is a STRICT rule. The word "Investment" should NEVER appear in any proposal.

BE CONCISE:
"We are going to help you grow your business" -> "Accelerate Growth."

BE TECHNICAL:
Use precise, industrial language. Words like: Deploy, Architect, Synthesize,
Validate, Execute, Vector, Velocity, Calibrate, Precision, Engineered.

BE CONFIDENT:
Remove "soft" words (maybe, hopefully, try). Use "hard" words (will, must, guaranteed).

================================================================================
## 09. EXECUTION CHECKLIST
================================================================================

Before finalizing any output, run this internal validation:

1. THE ASYMMETRY TEST (NEW - CRITICAL)
   Is the content LEFT-ANCHORED? Centered content = PowerPoint template.
   Content should live in the LEFT 55% of the slide. Right 45% = negative space.
   EXCEPTION: Only closing slides may use centered layout if specifically requested.

2. THE RED ACCENT TEST (NEW - CRITICAL)
   Does the slide have ONE red accent element that draws the eye?
   Red should be used for: section labels, accent bars, numbered sequences.
   If a slide has 0 red elements, add a section label or accent bar.
   If a slide has 3+ red elements, remove some - too much red = no focal point.

3. THE SQUINT TEST
   If I squint, can I clearly see the one most important element?
   If no, increase contrast/scale.

4. THE BREATH TEST
   Is there enough negative space? If the slide feels "full," remove 20% of the content.
   RULE: No slide should use more than 60% of the canvas area.

5. THE ALIGNMENT TEST
   Is every single element snapped to the grid?
   Left margin: 60px. Use consistent x positions across slides.

6. THE VIBE TEST
   Does this look like a PowerPoint, or does it look like a frame from Blade Runner 2049?
   If it looks like PowerPoint, start over.

7. THE COLLISION TEST (CRITICAL FOR PDF EXPORT)
   Text elements must NEVER touch or overlap other text elements.
   Verify minimum 20px vertical gap between all text blocks.
   If text appears crowded, increase spacing immediately.

8. THE CONTAINER TEST (CRITICAL FOR PDF EXPORT)
   When text is placed inside or over a box/card element, there must be
   at least 28px padding from ALL edges of the container.
   Text should never touch or appear too close to box borders.

9. THE DENSITY TEST (NEW)
   Count the number of distinct text elements on the slide.
   - Cover slide: MAX 5 elements
   - Content slides: MAX 8 elements
   - Data/pricing slides: MAX 12 elements
   If over the limit, consolidate or remove elements.

================================================================================
## 09B. MANDATORY SPACING RULES (PDF SAFETY)
================================================================================

These rules ensure content renders correctly in PDF exports where rendering
may differ slightly from the editor preview.

### Minimum Vertical Gaps Between Elements

TEXT TO TEXT (same group):     12px minimum
TEXT TO TEXT (different group): 20px minimum
HEADER TO BODY TEXT:           16px minimum
PRICE/NUMBER TO LIST:          20px minimum
LIST ITEM TO LIST ITEM:        8px minimum (via line-height)

### Container Padding Requirements

When placing text inside a box or card shape:

TOP PADDING:    16px minimum
BOTTOM PADDING: 16px minimum
LEFT PADDING:   20px minimum
RIGHT PADDING:  20px minimum

### The Safety Margin Rule

Always add 4-8px MORE spacing than looks "perfect" in the editor.
PDF rendering can compress spacing slightly. Build in a buffer.

### Common Spacing Errors to Avoid

- Section label directly touching the price below it (add 16px gap)
- Bullet list too close to the heading above (add 20px gap)
- Text touching the edge of a containing box (add 20px padding)
- Multiple text blocks that visually merge into one (add clear separation)

================================================================================
## 10. SLIDE-SPECIFIC GUIDANCE
================================================================================

### COVER SLIDES
- Use THE MONOLITH archetype
- Hero headline should dominate 60% of visual weight
- Meta-data (client, date) should be whisper-quiet in corners
- Consider full-bleed atmospheric background image at low opacity

### OBJECTIVE/CONTENT SLIDES
- Use THE MAGAZINE SPREAD archetype
- Narrow text column (40% width) paired with vast negative space
- Section headers in mono font, tiny, uppercase, tracked wide

### OPTIONS/PRICING SLIDES
- Use THE DASHBOARD archetype
- Thin 1px divider lines between options
- Hero numbers for investment amounts
- Avoid equal-sized boxes; vary the visual weight

### DATA/STATS SLIDES
- Make one number THE HERO at massive scale
- Supporting data in micro-typography
- Use mono font for all numbers

### CLOSING SLIDES
- Return to THE MONOLITH
- Single powerful statement or brand mark
- Maximum negative space
- No clutter, no calls-to-action

================================================================================
## 11. BACKGROUND TREATMENT
================================================================================

CLEAN BLACK BACKGROUNDS - No textures, no gradients, no grain.

### The Rule

Backgrounds should be SOLID BLACK (#000000). Period.

The visual interest comes from:
- Strong typography hierarchy
- Strategic use of red accent color
- Well-designed content cards with subtle borders
- Intentional negative space
- A subtle rounded frame/border around the slide

### What NOT to do

- NO film grain overlays
- NO noise textures
- NO grid patterns
- NO gradients on backgrounds
- NO vignettes
- NO AI-generated background images (unless specifically requested)

### When to Use Background Images

Only add background images when:
- The user specifically requests them
- A photo is needed for visual storytelling
- The content calls for it (e.g., a mood board slide)

When used, background images should be:
- High quality, cinematic photography
- Low opacity (15-25%) so text remains readable
- Positioned to complement, not compete with content

================================================================================
## 12. THE VALIDATE AESTHETIC: DIGITAL BRUTALISM & CINEMATIC UTILITY
================================================================================

### Introduction

The design philosophy behind VALIDATE is not merely about "dark mode"; it is about
recreating the psychological weight and prestige of cinema within a functional UI.
It merges the utility of a dashboard with the emotion of a film trailer.

Standard B2B SaaS applications are often characterized by sterility: white backgrounds,
blue buttons, and an abundance of light gray borders. They feel temporary. VALIDATE
feels permanent. It draws inspiration from high-end editorial layouts, movie title
cards, and Brutalist architecture. The goal is to make the user (the proposal writer)
feel like a Director, and the client (the viewer) feel like an Audience.

This section outlines the three core pillars of this design language:
Immersion, Hierarchy, and Tension.

### I. IMMERSION: The Void as a Canvas

The most immediate characteristic of the VALIDATE interface is its absolute rejection
of white space in favor of "void space."

TRUE BLACK VS. DARK GREY:
Many applications use dark grey (#121212) to soften the eyes. VALIDATE uses True Black
(#000000) for the primary background. This is a deliberate choice to dissolve the
boundaries of the screen. On OLED displays, True Black turns off the pixels entirely,
making the interface feel less like a "webpage" and more like a projection in a dark room.

THE LIGHTBOX EFFECT:
Content in VALIDATE is not placed on the background; it emerges from it. We use
zinc-900 and zinc-950 for cards and sidebars, creating subtle layers of depth without
breaking the immersion. This mimics the environment of a video editing suite
(like DaVinci Resolve or Premiere Pro), which signals to the user: This is a
workspace for professionals.

CHROMATIC RESTRAINT:
The color palette is strictly limited to:
- Void Black: The canvas.
- Zinc/Concrete: The structure.
- Signal Red: The action.

There are no greens for success or oranges for warnings. There is only the monochrome
world of the data and the Red pulse of interaction. This limitation forces the design
to rely on layout and typography rather than color coding to communicate meaning.

### II. HIERARCHY: Oswald vs. Inter

Typography is the primary interface of VALIDATE. Because we lack heavy iconography
or colorful illustrations, type must do the heavy lifting. We utilize a "Dual-Tone"
typographic system.

THE VOICE OF GOD (Oswald):
For headers, titles, and data points that require impact, we use Oswald. It is a
reworking of the classic "Alternate Gothic" typeface. It is tall, condensed, and authoritative.
- Usage Rule: Oswald is almost always uppercase. It is used for h1 through h3.
- Psychology: It mimics movie poster credits and industrial warning labels. When a
  user sees a price or a client name in Oswald, it feels immutable and significant.

THE VOICE OF REASON (Inter):
For body copy, inputs, and functional text, we use Inter. It is highly legible,
neutral, and invisible.
- Usage Rule: Inter is used for descriptions, rationales, and interface toggles.
- Psychology: If Oswald is the "Trailer," Inter is the "Script." It grounds the
  lofty aesthetics in readability.

THE OUTLINE TEXT:
A signature flourish in the design is the use of large, outlined transparent text
(CSS -webkit-text-stroke). This allows us to put massive words (like "VALIDATE")
on the screen without overwhelming the visual weight. It creates texture and fills
negative space without competing for attention.

### III. TENSION: Interaction & Spacing

A cinematic interface must feel "heavy." Elements should not feel like they are
floating away; they should feel anchored.

DENSITY VS. AIR:
The Sidebar is dense. It is a cockpit—high information density, small text (text-xs),
and tight grouping. This is where work happens.
In contrast, the Proposal View is airy. We use massive margins (padding lg:p-24) and
gaps (gap-24). This contrast between the Control Center (Sidebar) and the Canvas
(Main View) creates a satisfying rhythm. The user inputs messy data in the tight
sidebar, and the machine renders it into spacious, elegant outputs.

THE RED LINE:
We use a specific shade of red (red-700 or #b91c1c). This is not a bright "Startup Red";
it is a "Blood Red" or "Cinema Curtain Red."
- Usage: It is used sparingly. A thin border on the left of a card. A single button. A hover state.
- Meaning: Red signifies Action or Highlight. Because the rest of the app is monochrome,
  a 1-pixel red border draws the eye instantly. It creates visual tension—a hot wire
  running through a cold machine.

BRUTALIST BORDERS:
We prefer visible, 1px borders (border-zinc-800) over soft drop shadows. Shadows imply
a light source and a 3D physical world (Material Design). Borders imply a grid, a
schematic, or a blueprint. This aligns with the "Proposal Machine" concept—we are
building a blueprint for a project.

### IV. UX RULES FOR THE DEVELOPER

If you are extending the VALIDATE app, follow these strict rules to maintain the philosophy:

1. Never use pure white (#FFFFFF) for large blocks of background.
   White is only for text and high-contrast accents.

2. Uppercase is for Architecture, Lowercase is for Content.
   If it's a label, a button, or a header, try Uppercase + Tracking (tracking-widest).
   If it's a sentence, use sentence case.

3. No Rounded Corners > 0.75rem.
   We are not building a friendly social network. Keep border radiuses tight
   (rounded-lg or rounded-sm).

4. Animation should be slow.
   Use duration-700 or duration-1000 for fades. Fast animations feel "techy."
   Slow animations feel "luxury."

5. Data over Decoration.
   Do not add icons unless they serve a critical function. The text is the decoration.

================================================================================
`;

// Shorter version for token-limited contexts
export const DESIGN_RULES_SHORT = `
DESIGN PHILOSOPHY:
- Clean, minimal, professional. Let typography do the work.
- Maximum intent, minimum noise. Every pixel earns its place.
- The luxury of void. Negative space is an active design element.
- Hierarchy through contrast, not volume.

LAYOUT:
- Asymmetrical grid, offset content to left/right third
- Content cards with rounded corners (8-12px) and subtle dark borders
- Archetypes: Monolith (single hero element), Split-World (50/50), Magazine Spread, Dashboard

TYPOGRAPHY:
- Bebas Neue for headlines (white), JetBrains Mono for meta-data
- Go HUGE or go tiny. Avoid middle sizes (24-36px)
- Headlines: white. Body: light gray (#A3A3A3). Labels: red accent (#C41E3A)

COLORS - THE VALIDATE PALETTE:
- Background: Pure black (#000000)
- Cards: Dark charcoal (#18181B) with subtle border (#27272A)
- Accent: VALIDATE Red (#C41E3A) - USE SPARINGLY (5-10% max)
- Red is for: section labels, numbered lists (01, 02, 03), accent bars
- Red is NOT for: headlines, body text, backgrounds

IMAGERY:
- Only add images when specifically needed
- Cinematic, high-quality photography only
- Low opacity (15-25%) for backgrounds
- Avoid: Cartoon, Stock Photo, Generic Corporate

DATA VIZ:
- Thin 1px lines, no solid fills
- Monospace numbers
- Make hero numbers massive (white), supporting labels in red

BACKGROUNDS:
- SOLID BLACK. No textures, no grain, no gradients.
- Visual interest comes from typography and red accents, not background noise.
`;

// Image generation style guidance
export const IMAGE_STYLE_TOKENS = {
  positive: [
    'Octane Render',
    'Raytracing',
    'Volumetric Lighting',
    'Subsurface Scattering',
    'Caustics',
    'Depth of Field',
    'Bokeh',
    'Cinematic Lighting',
    '8k Resolution',
    'Dark moody atmosphere',
    'Rich shadows',
    'Film grain texture',
    'Macro photography',
    'Abstract',
    'Hyper-real',
    'Premium',
    'Luxurious',
    'Minimalist'
  ],
  negative: [
    'Cartoon',
    'Illustration',
    'Flat',
    'Vector',
    'Low Poly',
    'Generic Corporate',
    'Stock Photo',
    'Handshake',
    'Whiteboard',
    'Bright cheerful',
    'Clip art',
    'Busy',
    'Cluttered'
  ]
};

// Default background texture prompts - PURE ABSTRACT TEXTURES ONLY
// These prompts are carefully crafted to generate ONLY textures, no objects
export const BACKGROUND_PROMPTS = [
  "Generate ONLY a seamless texture pattern. Dark grey noise grain like analog TV static. Pure abstract random pixels. No shapes, no objects, no recognizable forms. Just grey and charcoal colored digital noise filling the entire frame.",
  "Generate ONLY a seamless texture pattern. Subtle crosshatch grid lines on dark background. Thin grey lines intersecting at angles. Pure geometric pattern. No objects, no text, no shapes. Just an abstract grid texture.",
  "Generate ONLY a seamless texture pattern. 35mm film grain effect, dark grey with subtle specks and scratches. Like an old film negative. Pure texture, no images, no objects, no shapes. Just organic noise.",
  "Generate ONLY a seamless texture pattern. Gunmetal grey gradient with subtle dust particles. Like a matte surface under soft light. No objects, no shapes, no text. Pure abstract gradient with texture.",
  "Generate ONLY a seamless texture pattern. Halftone dot pattern in dark grey and black. Evenly spaced tiny dots creating a screen print effect. No images, no objects. Just the pure dot pattern texture.",
  "Generate ONLY a seamless texture pattern. Vertical scanlines like an old CRT monitor. Thin dark grey lines on black. Pure linear pattern. No objects, no text, no shapes. Just scanline texture.",
  "Generate ONLY a seamless texture pattern. Concrete or paper texture in dark charcoal grey. Subtle organic grain and fiber. No objects, no shapes, no text. Just raw material texture.",
  "Generate ONLY a seamless texture pattern. Soft dark gradient from charcoal to black with subtle atmospheric haze. Like fog or smoke. No objects, no shapes. Just pure gradient atmosphere."
];

// Layout constants based on design rules
export const LAYOUT = {
  // Anchor points
  anchors: {
    topLeft: { x: 60, y: 40 },      // Meta-data
    bottomLeft: { x: 60, y: 400 },   // Heavy anchor for headlines
    topRight: { x: 780, y: 40 },     // Status indicators
    bottomRight: { x: 780, y: 470 }  // Navigation/page
  },
  // Golden ratio split points
  goldenSplit: {
    leftThird: 300,   // Left third boundary
    rightThird: 600   // Right third boundary
  },
  // Canvas dimensions
  canvas: {
    width: 900,
    height: 506
  }
};

// ============================================
// SLIDE COMPOSITION TEMPLATES (for AI reference)
// ============================================
// These are concrete examples of good layouts.
// The AI should use these as starting points.
export const SLIDE_TEMPLATES = `
================================================================================
SLIDE COMPOSITION TEMPLATES
================================================================================

These are exact layout specifications for each slide type. Use these as your
starting point, adjusting content to fit the specific proposal.

================================================================================
TEMPLATE: COVER SLIDE (MONOLITH)
================================================================================

VISUAL GOAL: Dramatic, cinematic first impression. The title should feel like
a movie poster - bold, simple, unforgettable. ASYMMETRY IS CRITICAL.

CRITICAL: NEVER center the title. Left-anchor creates tension and sophistication.
Centered titles look like PowerPoint. Left-anchored titles look like cinema.

ELEMENTS (in render order):
1. RED ACCENT BAR (signature element - REQUIRED)
   x: 60, y: 145
   width: 50, height: 4, color: #C41E3A
   This is the visual anchor that starts the eye journey
   NEVER skip this element - it's the VALIDATE signature

2. CLIENT NAME (bold, above tagline)
   x: 60, y: 160
   fontSize: 56, fontFamily: "Bebas Neue", fontWeight: "bold", color: #FFFFFF
   UPPERCASE, left-aligned
   Example: "WAGMORE"

3. TAGLINE/PROJECT TITLE (secondary hero)
   x: 60, y: 220
   fontSize: 48, fontFamily: "Bebas Neue", fontWeight: "bold", color: #FFFFFF
   UPPERCASE, left-aligned
   Example: "ALWAYS WITH YOU"

4. SUBTITLE (proposal type + date)
   x: 60, y: 290
   fontSize: 13, fontFamily: "Inter", color: #71717A
   Example: "Creative Services Proposal"

5. DATE (below subtitle)
   x: 60, y: 310
   fontSize: 11, fontFamily: "JetBrains Mono", color: #52525B
   Example: "January 2026"

6. VALIDATE LOGO (bottom-right corner - REQUIRED)
   type: "image"
   src: Use the VALIDATE_W.png logo from the assets folder
   x: 800, y: 460
   width: 80, height: auto (maintain aspect ratio, roughly 20px height)
   This is the brand signature - use the ACTUAL LOGO IMAGE, not text

THE GOLDEN RULE: Content lives in the LEFT 55% of the slide.
The RIGHT 45% is intentionally EMPTY - this is premium negative space.
The asymmetry creates visual tension and sophistication.

================================================================================
TEMPLATE: OBJECTIVE SLIDE (MAGAZINE_SPREAD)
================================================================================

VISUAL GOAL: Elegant single-column layout with clear information hierarchy.
Primary content dominates; secondary details are clearly subordinate.

ELEMENTS:
1. SECTION LABEL (red accent, top)
   x: 60, y: 55
   fontSize: 11, fontFamily: "JetBrains Mono", color: #C41E3A
   UPPERCASE, tracking-wide
   Text: "PROJECT OBJECTIVE"

2. MAIN HEADLINE (section anchor - THE HERO)
   x: 60, y: 85
   fontSize: 32, fontFamily: "Bebas Neue", fontWeight: "bold", color: #FFFFFF
   width: 500, height: auto
   UPPERCASE
   CRITICAL: Keep to 1-2 lines max. If headline is long, break it thoughtfully.
   Example: "EMOTIONALLY DIFFERENTIATE IN A CROWDED MARKET"

3. BODY PARAGRAPH (narrow column - THE STORY)
   x: 60, y: 155
   fontSize: 15, fontFamily: "Inter", color: #D4D4D8
   width: 450 (narrow column for readability)
   line-height: 1.7
   2-4 sentences describing the project goal.

4. PRIMARY AUDIENCE SECTION
   x: 60, y: 260
   SECTION LABEL: fontSize: 11, fontFamily: "JetBrains Mono", color: #52525B
   Text: "TARGET AUDIENCE" (NOT red - secondary importance)

   BULLET LIST (starts y: 280):
   fontSize: 13, fontFamily: "Inter", color: #A3A3A3
   Use "•" prefix, line-height: 1.8
   Max 3 bullets, keep concise

5. DISTRIBUTION SECTION (if needed)
   x: 60, y: 370
   SECTION LABEL: fontSize: 11, color: #52525B
   Text: "DISTRIBUTION"

   BULLET LIST: fontSize: 13, color: #A3A3A3

HIERARCHY RULE: Only the "PROJECT OBJECTIVE" label should be red.
Secondary section labels (TARGET AUDIENCE, DISTRIBUTION) use muted gray (#52525B).
This creates clear visual hierarchy - one red accent per slide.

LAYOUT NOTE: Content stays in left 55% of slide. Right 45% is negative space.

================================================================================
TEMPLATE: CREATIVE APPROACH SLIDE (SPLIT-WORLD)
================================================================================

VISUAL GOAL: Present the creative strategy as a two-part composition.
Left side: The concept. Right side: The payoff (signature quote or visual).

THIS IS A SPLIT-WORLD LAYOUT - 60% left content, 40% right accent card.

LEFT SIDE (Primary Content):
1. SECTION LABEL
   x: 60, y: 55
   fontSize: 11, fontFamily: "JetBrains Mono", color: #C41E3A
   Text: "CREATIVE APPROACH"

2. CONCEPT HEADLINE (the big idea name)
   x: 60, y: 85
   fontSize: 32, fontFamily: "Bebas Neue", color: #FFFFFF
   width: 400
   Example: "ALWAYS WITH YOU"

3. CONCEPT DESCRIPTION (the narrative)
   x: 60, y: 135
   fontSize: 15, fontFamily: "Inter", color: #D4D4D8
   width: 400, line-height: 1.7
   3-5 sentences describing the creative approach

4. TONE SECTION
   x: 60, y: 280
   LABEL: fontSize: 11, fontFamily: "JetBrains Mono", color: #52525B
   Text: "TONE"

   BULLET LIST (starts y: 300):
   fontSize: 13, fontFamily: "Inter", color: #A3A3A3
   3 tone descriptors as bullets

RIGHT SIDE (Signature Card):
5. ACCENT CARD (the emotional anchor)
   x: 500, y: 55
   width: 340, height: 200
   background: #18181B
   border-left: 3px solid #C41E3A (signature red edge)
   borderRadius: 8
   padding: 28px

   INSIDE THE CARD:
   - LABEL: "CLOSING LINE" or "KEY MOMENT"
     fontSize: 11, fontFamily: "JetBrains Mono", color: #C41E3A
     Position: top of card content

   - QUOTE TEXT:
     fontSize: 17, fontFamily: "Inter", fontStyle: italic, color: #FFFFFF
     The signature line or key moment quote
     Wrapped in quotation marks

   - ATTRIBUTION (optional):
     fontSize: 11, fontFamily: "Inter", color: #71717A
     Below quote, e.g., "Wagmore Smart Collars - Built for your best friend"

THE CARD CREATES BALANCE: The right card prevents the left content
from feeling lonely. It provides a visual anchor and emotional payoff.

================================================================================
TEMPLATE: OPTIONS SLIDE (DASHBOARD)
================================================================================

VISUAL GOAL: Present 2-3 creative options as elegant cards. Each option
should feel like a distinct product offering.

LAYOUT VARIANTS:
- 2 options: Side by side, each 380px wide, 20px gap
- 3 options: Horizontal row, each 260px wide, 20px gaps
- 1 option: Centered, 500px wide

CARD STRUCTURE (for each option):
1. CARD BACKGROUND
   color: #18181B, borderRadius: 8
   Internal padding: 25px all sides

2. OPTION LABEL (red accent)
   fontSize: 11, fontFamily: "JetBrains Mono", color: #C41E3A
   UPPERCASE, e.g., "OPTION A" or "01"

3. OPTION NAME
   fontSize: 20, fontFamily: "Bebas Neue", color: #FFFFFF
   UPPERCASE, e.g., "SIGNATURE PACKAGE"

4. PRICE (hero number)
   fontSize: 32, fontFamily: "Bebas Neue", color: #FFFFFF
   e.g., "$45,000"

5. DESCRIPTION
   fontSize: 13, fontFamily: "Inter", color: #A3A3A3
   width: card width - 50px (padding)

6. DELIVERABLES (bullet list)
   fontSize: 13, fontFamily: "Inter", color: #D4D4D8
   Use "•" bullets, max 4-5 items

SPACING RULES (PDF-SAFE - includes buffer for rendering):
- Label to name: 20px
- Name to price: 18px
- Price to description: 28px
- Description to bullets: 28px
- Between bullets: 22px

================================================================================
TEMPLATE: DELIVERABLES SLIDE (DASHBOARD)
================================================================================

VISUAL GOAL: Present what the client will receive as premium offerings.
Two main cards with clear hierarchy, plus supporting details below.

THIS SLIDE USES UNEQUAL CARD SIZES FOR VISUAL INTEREST.

HEADER:
x: 60, y: 50
fontSize: 32, fontFamily: "Bebas Neue", color: #FFFFFF
Text: "DELIVERABLES"

PRIMARY CARDS (2 cards, unequal widths for visual interest):
Card 1 (Hero Deliverable - larger):
- x: 60, y: 100
- width: 380, height: 140
- background: #18181B, borderRadius: 8
- border-left: 3px solid #C41E3A (red accent edge)
- padding: 28px

Card 2 (Secondary Deliverable):
- x: 480, y: 100
- width: 360, height: 140
- background: #18181B, borderRadius: 8
- border-left: 3px solid #C41E3A
- padding: 28px

INSIDE EACH CARD:
1. CATEGORY LABEL (red accent)
   fontSize: 11, fontFamily: "JetBrains Mono", color: #C41E3A
   e.g., "HERO COMMERCIAL" or "SOCIAL CUTDOWNS"

2. DELIVERABLE NAME (hero text)
   fontSize: 24, fontFamily: "Bebas Neue", color: #FFFFFF
   Gap: 16px below label
   e.g., "1X 60-SECOND SPOT"

3. DESCRIPTION
   fontSize: 13, fontFamily: "Inter", color: #A3A3A3
   Gap: 12px below name
   Brief description of what's included

SUPPORTING SECTION (below cards):
x: 60, y: 280
LABEL: fontSize: 11, fontFamily: "JetBrains Mono", color: #52525B
Text: "FINAL FORMATS" (gray, not red - secondary)

BULLET LIST (starts y: 305):
fontSize: 13, fontFamily: "Inter", color: #A3A3A3
3-4 bullets about formats, revisions, timeline
Line-height: 1.8

VISUAL BALANCE: The left card being slightly wider creates asymmetry.
The red left-border on both cards creates visual cohesion.

================================================================================
TEMPLATE: PRODUCTION APPROACH SLIDE (DASHBOARD)
================================================================================

VISUAL GOAL: Show the production phases clearly WITHOUT overwhelming the viewer.
This slide builds confidence by showing a clear, professional process.

CRITICAL: Keep this slide SIMPLE. No extra cards at the bottom.
Just the header + 3 phase columns. That's it.

HEADER:
x: 60, y: 50
fontSize: 32, fontFamily: "Bebas Neue", color: #FFFFFF
Text: "PRODUCTION APPROACH"

LAYOUT: 3-column structure for 3 phases (clean, minimal)

COLUMN POSITIONS:
- Column 1: x=60
- Column 2: x=330
- Column 3: x=600
- Column width: 240px each
- All columns start at y: 110

COLUMN STRUCTURE (each phase):
1. PHASE NUMBER + LABEL (red accent)
   fontSize: 11, fontFamily: "JetBrains Mono", color: #C41E3A
   Format: "01  PRE-PRODUCTION" (number + space + name)
   UPPERCASE

2. PHASE CONTENT (bullet points)
   Starting y: 140 (30px below label)
   fontSize: 13, fontFamily: "Inter", color: #D4D4D8
   Line-height: 2.0 (generous spacing)
   Max 5 bullets per phase - BE CONCISE
   Each bullet: "• " prefix

RECOMMENDED PHASES:
- 01 PRE-PRODUCTION: Creative development, casting, locations, scripting
- 02 PRODUCTION: Shoot days, crew, equipment
- 03 POST-PRODUCTION: Edit, color, sound, delivery

DO NOT ADD:
- Extra cards at the bottom (like "LOCATIONS" or "KEY EQUIPMENT")
- Background boxes behind the columns
- More than 5 bullets per column
- Dense paragraphs of text

THE GOAL IS SCANNABLE CLARITY, NOT COMPREHENSIVE DETAIL.
If clients want more detail, they'll ask. Keep it clean.

================================================================================
TEMPLATE: ESTIMATED COST SLIDE (DASHBOARD)
================================================================================

CRITICAL NAMING RULE: NEVER use the word "Investment". ALWAYS use "Estimated Cost".
This applies to:
- The slide header: "ESTIMATED COST" (not "Investment")
- The total label: "TOTAL ESTIMATED COST" (not "Total Investment")
- Any references in copy

VISUAL GOAL: Present pricing as premium and justified. The breakdown shows
value, not just cost. Make it feel like a luxury invoice, not a spreadsheet.

SECTION HEADER:
x: 60, y: 35
fontSize: 32, fontFamily: "Bebas Neue", color: #FFFFFF
Text: "ESTIMATED COST" (NEVER "Investment")
NOTE: Position this HIGHER on the slide (y: 35) to give content more room

================================================================================
COST CARDS - THREE COLUMN LAYOUT
================================================================================

USE CLEAN COLUMNS, NOT BOXED CARDS.
The design should feel open and premium, not cramped in boxes.

THREE-COLUMN LAYOUT (no background boxes):
- Column 1: x=60
- Column 2: x=330
- Column 3: x=600
- Column width: 240px each
- Content starts at y: 100

RED VERTICAL ACCENT BAR (REQUIRED for each column):
- Position: Left edge of each column
- width: 3, height: 180 (consistent across all columns!)
- color: #C41E3A
- This creates visual rhythm across the slide

INSIDE EACH COLUMN - EXACT POSITIONING:

1. PHASE LABEL
   x: column_x + 20 (offset from red bar)
   y: 100
   fontSize: 11, fontFamily: "JetBrains Mono", color: #C41E3A
   UPPERCASE, e.g., "PRE-PRODUCTION"

2. PHASE AMOUNT (price - THE HERO)
   x: column_x + 20
   y: 130 (30px below label)
   fontSize: 28, fontFamily: "Bebas Neue", color: #FFFFFF
   e.g., "$12K - $16K" or "$28,000"
   This is the focal point of each column

3. LINE ITEMS (bullet list)
   x: column_x + 20
   y: 175 (45px below price - generous gap)
   fontSize: 13, fontFamily: "Inter", color: #A3A3A3
   Line height: 2.0 (extra spacing!)
   Use "• " prefix for each item
   Max 4 items per column
   Keep descriptions SHORT (2-4 words each)

COLUMN SPACING SUMMARY:
- Label to price: 30px
- Price to first bullet: 45px
- Between bullets: 28px (use line-height 2.0)

================================================================================
TOTAL SECTION - THE GRAND FINALE
================================================================================

Position the total section with CLEAR separation from columns above.

HORIZONTAL RULE:
- y: 360
- x: 60 to x: 840 (full width)
- height: 1px, color: #27272A

"TOTAL ESTIMATED COST" label:
- x: 60, y: 385 (25px below line)
- fontSize: 11, fontFamily: "JetBrains Mono", color: #52525B
- UPPERCASE

TOTAL AMOUNT (THE HERO NUMBER):
- x: 60, y: 415 (30px below label)
- fontSize: 48, fontFamily: "Bebas Neue", color: #FFFFFF
- This should be the LARGEST number on the slide
- e.g., "$65,000 - $85,000"

CRITICAL RULES:
1. The total amount must be MASSIVE and on its OWN LINE
2. NOTHING should appear below the total price - no explanatory text, no notes, no disclaimers
3. The total number is the FINAL element on this slide - it's the climax
4. Let the number speak for itself with confidence

DO NOT ADD below the total:
- "Room to scale" notes
- "Revisions included" text
- Any disclaimers or explanations
- Fine print of any kind

================================================================================
TEMPLATE: CLOSING SLIDE (MONOLITH)
================================================================================

VISUAL GOAL: End with grace and confidence. This is NOT a generic "Thank You"
slide - it's the final emotional beat of your cinematic presentation.

CRITICAL: Use ASYMMETRY even on the closing. Left-anchored feels premium.
Centered "THANK YOU" feels like a PowerPoint template.

OPTION A: LEFT-ANCHORED (PREFERRED)
=========================================

1. RED ACCENT BAR (signature element)
   x: 60, y: 180
   width: 50, height: 4, color: #C41E3A

2. THANK YOU MESSAGE
   x: 60, y: 200
   fontSize: 56, fontFamily: "Bebas Neue", color: #FFFFFF
   align: "left"
   Text: "THANK YOU"

3. CLOSING SUBTEXT (personalized, warm)
   x: 60, y: 270
   fontSize: 15, fontFamily: "Inter", color: #A3A3A3
   align: "left"
   width: 450
   Make it SPECIFIC to the client, not generic.
   Example: "We're excited to help Wagmore tell a story as loyal and warm as the dogs who wear your collars."
   NOT: "We look forward to working with you."

4. VALIDATE LOGO (bottom-right corner - REQUIRED)
   type: "image"
   src: Use the VALIDATE_W.png logo from the assets folder
   x: 800, y: 460
   width: 80, height: auto (maintain aspect ratio, roughly 20px height)
   This is the brand signature - use the ACTUAL LOGO IMAGE, not text

OPTION B: CENTERED (Only if specifically requested)
=========================================

If client prefers centered, use:
- Red accent bar centered above headline
- Thin horizontal line (1px, #27272A) below subtext
- Still keep 60%+ negative space

THE EMOTIONAL CLOSE:
The closing message should reference something specific about the project
or client. Generic closings feel lazy. Personalized closings feel premium.

DO NOT ADD:
- Contact info (it's already in the shared link / email)
- Multiple lines of text
- Any additional decorative elements

NEGATIVE SPACE: 70%+ of the slide should be empty.
Let the words breathe. The silence is part of the message.

================================================================================
COMPOSITIONAL PRINCIPLES
================================================================================

THE RULE OF ASYMMETRY:
- Never center everything. Off-center layouts feel more sophisticated.
- The "heavy" content (headlines, numbers) should anchor to one side.
- The opposite side should breathe.

THE RED DOT PRINCIPLE:
- If someone squints at your slide, they should see ONE red element.
- The red draws the eye to the most important label or number.
- Multiple red elements compete and lose impact.

THE VERTICAL RHYTHM (PDF-SAFE):
- Establish a baseline grid of 24px (not 20px - accounts for PDF rendering).
- All vertical spacing should be multiples of 24px (24, 48, 72, 96).
- Text elements should NEVER be closer than 20px vertically.
- When in doubt, add MORE space - it always looks better than crowding.

THE FONT SIZE GAP:
- There should always be a 2x+ size difference between hierarchy levels.
- 56px headline + 17px body = good (3.3x)
- 32px headline + 20px body = bad (1.6x, too similar)

THE CARD BREATHING RULE (PDF-SAFE):
- Cards should have 28px internal padding minimum (not 25px - extra buffer for PDF).
- Content should NEVER touch card edges - maintain 28px clearance.
- Cards should have 24px minimum gap between each other.
- Text elements inside cards need 24px vertical spacing between them.

================================================================================
`;

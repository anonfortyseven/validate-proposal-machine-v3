'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Sparkles, Send, RefreshCw, Plus, ArrowLeft, X, AlertCircle, Type, Image, Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Upload, Check, Cloud, Save, FolderOpen, Folder, Clock, Undo2, Redo2, Archive, ArchiveRestore, Eye, EyeOff, Menu, Edit3, FolderPlus, Download, MoreVertical, Grid, List, Search, ImageIcon, Move, Crop, ZoomIn, ZoomOut, Play, Video, FileDown, Link2, Copy, Lock, LogOut, Share2, User, Shield } from 'lucide-react';
import { useAuth } from './LoginGate';
import ShareModal from './ShareModal';
import { BRAND_GUIDELINES, BRAND_GUIDELINES_SHORT, COLORS as BRAND_COLORS, TYPOGRAPHY, FONTS } from '../config/brandGuidelines';
import { DESIGN_RULES, DESIGN_RULES_SHORT, IMAGE_STYLE_TOKENS, SLIDE_TEMPLATES } from '../config/designRules';
import { validateProposal, isProposalValid, getValidationSummary } from '../utils/slideValidator';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import pako from 'pako';

// VALIDATE logo URL - uses env var or falls back to placeholder
const LOGO_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/validate-projects/assets/VALIDATE_W.png`
  : 'https://placehold.co/200x50/0c0c0e/ffffff?text=VALIDATE';

// Helper to resolve image sources - handles VALIDATE_W.png references
const resolveImageSrc = (src) => {
  if (!src) return src;
  if (src === 'VALIDATE_W.png' || src.endsWith('/VALIDATE_W.png')) {
    return LOGO_URL;
  }
  return src;
};

// Check if an image is the VALIDATE logo (needs special styling)
const isLogoImage = (src) => {
  if (!src) return false;
  return src === 'VALIDATE_W.png' || src.endsWith('/VALIDATE_W.png') || src.includes('VALIDATE_W.png');
};

// Storage is now 100% Supabase - no localStorage
// The projectStorage object (defined later) handles all persistence

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

// ============================================
// EXPIRATION MODAL
// SYSTEM PROMPT FOR AI GENERATION (Layout-Aware)
// ============================================
// EXPIRATION MODAL
const SYSTEM_PROMPT = `${BRAND_GUIDELINES}

${DESIGN_RULES}

${SLIDE_TEMPLATES}

================================================================================
SLIDE LAYOUT OUTPUT FORMAT
================================================================================

You are not just providing content - you are DESIGNING each slide.
You are a Creative Director making layout decisions based on the design rules above.

CANVAS: 900x506 pixels, origin top-left (0,0).

================================================================================
LAYOUT ARCHETYPES (choose one per slide based on content):
================================================================================

MONOLITH: Single massive headline dominating the slide, vast negative space.
- Use for: Cover, Closing slides
- Headline should use 60%+ of visual weight
- Minimal supporting elements, maximum breathing room

SPLIT_WORLD: 50/50 divide between typography (left) and space/potential imagery (right).
- Use for: Objective slides
- Left side: text column (x: 60-400)
- Right side: empty or subtle accent elements (x: 450-840)

MAGAZINE_SPREAD: 40% text column + vast negative space.
- Use for: Creative Approach slides
- Narrow text column creates focus
- Strategic placement of bullet points

DASHBOARD: Complex modular zones with thin 1px dividers.
- Use for: Options, Investment, Production slides
- Multiple cards/sections
- Thin line separators (#71717A, 1px height)
- Data-forward, organized zones

================================================================================
TYPOGRAPHY SIZES (use ONLY these - never in between):
================================================================================
56px: Hero headlines (cover title ONLY)
32px: Section titles ("PROJECT OBJECTIVE", "CREATIVE OPTIONS")
20px: Card titles, option names
17px: Primary body text, descriptions
13px: Labels, secondary text
11px: MINIMUM - metadata, labels

RULE: Go HUGE or tiny. The 24-36px range is forbidden.

================================================================================
FONTS (STRICT RULES - NO EXCEPTIONS):
================================================================================

ONLY THREE FONTS ALLOWED. No other fonts. Ever.

"Bebas Neue" - THE HEADLINE FONT
  - Use for: Hero titles, section headers, large numbers, VALIDATE logo
  - Always: fontWeight "bold", UPPERCASE text
  - Sizes: 56px (hero), 48px (closing), 32px (section titles, card amounts)
  - Color: #FFFFFF only
  - Example: "FEEL THE WONDER", "INVESTMENT", "$274,000"

"Inter" - THE BODY FONT
  - Use for: Descriptions, paragraphs, subtitles, body content
  - Always: fontWeight "normal"
  - Sizes: 17px (body), 15px (card descriptions), 13px (smaller descriptions)
  - Color: #D4D4D8 (light gray) or #A3A3A3 (muted)
  - Example: "Thank you for the opportunity to bring your vision to life."

"JetBrains Mono" - THE LABEL FONT
  - Use for: Labels, metadata, dates, client names, category headers
  - Always: fontWeight "normal", often UPPERCASE, letter-spacing feels wide
  - Sizes: 13px (labels), 11px (metadata)
  - Color: #71717A (muted gray), #52525B (very muted), or #C41E3A (red labels)
  - Example: "PRE-PRODUCTION", "December 23, 2025", "YUMIKO WORLD CO., LTD."

FONT DECISION TREE:
- Is it a big headline or number? → Bebas Neue, bold, white
- Is it a paragraph or description? → Inter, normal, gray
- Is it a label, date, or metadata? → JetBrains Mono, normal, muted

================================================================================
COLORS:
================================================================================
#000000: Background (ALWAYS black)
#18181B: Card backgrounds (use with borderRadius: 8)
#FFFFFF: Headlines, important text
#D4D4D8: Body text (light gray)
#71717A: Muted/secondary, divider lines
#52525B: Very muted elements
#C41E3A: VALIDATE Red accent (5-10% MAX - thin bars, labels only, NEVER headlines)

================================================================================
ELEMENT TYPES:
================================================================================

TEXT ELEMENT:
{
  "type": "text",
  "x": 60,
  "y": 120,
  "width": 780,
  "height": 80,
  "content": "HEADLINE TEXT",
  "fontSize": 56,
  "fontWeight": "bold",
  "fontFamily": "Bebas Neue",
  "color": "#FFFFFF",
  "align": "left"
}

SHAPE ELEMENT (thin lines, accent bars, card backgrounds):
{
  "type": "shape",
  "shapeType": "rect",
  "x": 60,
  "y": 95,
  "width": 50,
  "height": 1,
  "color": "#71717A",
  "borderRadius": 0
}

For cards, use borderRadius: 8:
{
  "type": "shape",
  "shapeType": "rect",
  "x": 60,
  "y": 120,
  "width": 380,
  "height": 300,
  "color": "#18181B",
  "borderRadius": 8
}

================================================================================
SLIDE STRUCTURE:
================================================================================

Each proposal MUST include these slides (in order):
1. Cover (MONOLITH) - Hero headline, client name, date
2. Objective (SPLIT_WORLD or MAGAZINE_SPREAD) - Project goals
3. Creative Approach (MAGAZINE_SPREAD) - Strategy and elements (if content provided)
4. Options (DASHBOARD) - Creative options with pricing (if multiple options)
5. Production (DASHBOARD) - Crew, gear, phases
6. Investment (DASHBOARD) - Cost breakdown with 3 phases
7. Closing (MONOLITH) - Thank you message

================================================================================
CRITICAL LAYOUT RULES (MUST FOLLOW):
================================================================================

SAFE ZONES - Never place content outside these boundaries:
- Top margin: y >= 50 (leave 50px at top)
- Bottom margin: y + height <= 480 (leave 26px at bottom)
- Left margin: x >= 50
- Right margin: x + width <= 850

TEXT OVERFLOW PREVENTION (CRITICAL - THESE ARE HARD LIMITS):

CHARACTER LIMITS BY FONT SIZE - NEVER EXCEED THESE:
- 56px Bebas Neue (hero): MAX 20 CHARACTERS - if longer, use 2 lines with height 140px
- 48px Bebas Neue: MAX 28 CHARACTERS
- 32px Bebas Neue: MAX 30 CHARACTERS per line
- 20px titles: MAX 40 CHARACTERS per line
- 17px body (500px wide): MAX 55 CHARACTERS per line
- 15px card text (210px wide): MAX 30 CHARACTERS per line
- 13px descriptions: MAX 50 CHARACTERS per line
- 11px labels: MAX 45 CHARACTERS per line

IF CONTENT EXCEEDS CHARACTER LIMIT - YOU MUST:
1. Split into multiple lines and increase height accordingly
2. Use a smaller font size
3. Abbreviate or condense the text
4. NEVER output text that will be cut off

TEXT HEIGHT CALCULATION:
- Single line: height = fontSize + 10
- Two lines: height = (fontSize * 2.4) + 10
- Three lines: height = (fontSize * 3.6) + 10
- ALWAYS verify text will fit BEFORE outputting the element

VERTICAL SPACING BETWEEN TEXT ELEMENTS:
- Between paragraph and next element: gap = paragraph.height + 30px
- Between bullet points: each bullet y = previous bullet y + previous bullet height + 15px
- Between section label and first bullet: 25px gap
- NEVER place two text elements where their y ranges overlap

PARAGRAPH WIDTH RULES:
- Body paragraphs: max width 500px (forces earlier line breaks, prevents overflow)
- Bullet point text: max width 450px
- If text is on left side of slide, keep x + width < 650 to leave breathing room

CARDS MUST HAVE VISIBLE CONTRAST:
- Card background: #18181B (not #000000)
- Card border: Add 1px #27272A border OR ensure card is visually distinct
- Card padding: Content inside cards should be inset 20px from card edges
- Card spacing: Minimum 20px gap between cards

CARD CONTENT OVERFLOW PREVENTION (STRICT):
- Card usable width = card width - 40px (20px padding each side)
- For 250px wide cards: max 30 characters per line at 13px font
- For 380px wide cards: max 45 characters per line at 15px font
- Maximum 4 bullet points per card (not 5)
- If description is too long: ABBREVIATE IT - don't let it overflow
- Card descriptions should be SHORT: max 2 lines, max 60 total characters
- Text must NEVER extend beyond card boundaries
- When in doubt, USE FEWER WORDS

CARD BOTTOM PADDING (CRITICAL):
- The LAST text element in a card must have y + height <= card.y + card.height - 25
- This means 25px minimum between last text baseline and card bottom edge
- If content is too tall, INCREASE the card height, don't squeeze the padding
- Calculate card height AFTER determining content: card.height = (lastElement.y + lastElement.height) - card.y + 30
- Cards should feel spacious, not cramped

CONTENT DENSITY RULES:
- Maximum 6 bullet points per slide
- Maximum 3 cards per slide
- If more content, SPLIT across multiple slides
- Each text block needs 20px vertical breathing room below it

VISUAL HIERARCHY ON DATA SLIDES:
- Section title: 32px Bebas Neue, white, top of slide
- Card headers: 13px JetBrains Mono, RED (#C41E3A), with 3px red bar to left
- Card numbers/amounts: 32px Bebas Neue, white
- Card descriptions: 13px Inter, gray (#A3A3A3)
- List items: 15px Inter, light gray (#D4D4D8), bullet as "•" character

BULLET POINT FORMATTING:
- Use "•" character (not "-" or "*")
- Bullet in gray (#71717A), text in light gray (#D4D4D8)
- Indent text 20px from bullet
- CRITICAL: Each bullet point must be its OWN text element with its own y position
- NEVER put multiple bullet points in a single text element with newlines

BULLET HEIGHT AND SPACING CALCULATION:
- Short bullet (< 40 characters): height = 30px, next bullet y = current y + 45px
- Medium bullet (40-60 characters): height = 50px (2 lines), next bullet y = current y + 65px
- NEVER exceed 60 characters per bullet - split into two bullets instead
- Font size for bullets: 15px inside cards, 17px on open slides
- Inside 210px card: MAX 28 characters per bullet line
- On open slides: MAX 50 characters per bullet line
- ALWAYS calculate the next y position based on ACTUAL content length

COVER SLIDE SPECIFICS (EXACTLY 5 ELEMENTS - NO MORE):
The cover slide is MINIMAL and PROMINENT. Only these 5 elements:
1. CLIENT NAME - Large, prominent, 48px Bebas Neue, WHITE (#FFFFFF), centered, y: 140
2. PROJECT NAME - Large, prominent, 48px Bebas Neue, WHITE (#FFFFFF), centered, y: 200
3. "Creative Services Proposal" - 15px Inter, OFF-WHITE (#A1A1AA), centered, y: 290
4. DATE - 13px JetBrains Mono, OFF-WHITE (#A1A1AA), centered, y: 320
5. VALIDATE - Large, prominent, 32px Bebas Neue, WHITE (#FFFFFF), centered, y: 420

ALL elements are CENTERED (align: "center", x: 100, width: 700)
NO other elements - no lines, no shapes, no extra text
The cover should feel clean, premium, and confident
NEVER use dark gray (#71717A or #52525B) on cover text - it's too hard to read

CLOSING SLIDE SPECIFICS:
- Centered layout
- Main message: 48px Bebas Neue, centered
- Subtext: 17px Inter, centered, below message with 40px gap
- VALIDATE: bottom-right corner
- Keep ALL text in upper 70% of slide (y < 350)

RED ACCENT BAR RULES (CRITICAL):
- Red bars (#C41E3A) are ONLY allowed in TWO contexts:
  1. As a left border on CARDS (3px wide, same height as card, touching card edge)
  2. As a small label accent on Investment/Production slides
- NEVER place a floating red bar next to plain text on black background
- NEVER use red bars on Objective/Overview slides - use gray (#71717A) horizontal lines instead
- If there's no card background (#18181B), there should be NO red bar
- Orphaned accent bars look broken - every bar must be attached to something

================================================================================
DESIGN PRINCIPLES:
================================================================================
- Every pixel must earn its place
- Negative space is power - don't fill every corner
- Red accent (#C41E3A) sparingly - ONLY on cards, small labels, NEVER floating, NEVER backgrounds
- The 10x rule: Largest element should be ~10x smallest (56px hero / 11px metadata)
- NEVER include page numbers, slide numbers, or footers on any slide
- Shapes render BEHIND text - place card backgrounds before text elements in array
- RIGHT SIDE BREATHING ROOM: On text-heavy slides, keep x + width < 700 to leave visual space

================================================================================
OUTPUT FORMAT:
================================================================================

Return ONLY valid JSON. Here are EXAMPLE slides showing proper formatting:

COVER EXAMPLE (EXACTLY 5 ELEMENTS - CENTERED, MINIMAL):
{
  "name": "Cover",
  "archetype": "MONOLITH",
  "background": { "color": "#000000" },
  "elements": [
    { "type": "text", "x": 100, "y": 140, "width": 700, "height": 60, "content": "CLIENT NAME", "fontSize": 48, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "center" },
    { "type": "text", "x": 100, "y": 200, "width": 700, "height": 60, "content": "PROJECT TITLE", "fontSize": 48, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "center" },
    { "type": "text", "x": 100, "y": 290, "width": 700, "height": 25, "content": "Creative Services Proposal", "fontSize": 15, "fontWeight": "normal", "fontFamily": "Inter", "color": "#A1A1AA", "align": "center" },
    { "type": "text", "x": 100, "y": 320, "width": 700, "height": 22, "content": "January 2026", "fontSize": 13, "fontWeight": "normal", "fontFamily": "JetBrains Mono", "color": "#A1A1AA", "align": "center" },
    { "type": "text", "x": 100, "y": 420, "width": 700, "height": 45, "content": "VALIDATE", "fontSize": 32, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "center" }
  ]
}

INVESTMENT SLIDE EXAMPLE (3 cards + total):
{
  "name": "Investment",
  "archetype": "DASHBOARD",
  "background": { "color": "#000000" },
  "elements": [
    { "type": "text", "x": 60, "y": 50, "width": 400, "height": 45, "content": "INVESTMENT", "fontSize": 32, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "left" },

    { "type": "shape", "shapeType": "rect", "x": 60, "y": 110, "width": 250, "height": 180, "color": "#18181B", "borderRadius": 8 },
    { "type": "shape", "shapeType": "rect", "x": 60, "y": 110, "width": 3, "height": 180, "color": "#C41E3A" },
    { "type": "text", "x": 80, "y": 125, "width": 210, "height": 20, "content": "PRE-PRODUCTION", "fontSize": 11, "fontWeight": "bold", "fontFamily": "JetBrains Mono", "color": "#C41E3A", "align": "left" },
    { "type": "text", "x": 80, "y": 155, "width": 210, "height": 40, "content": "$35,000", "fontSize": 32, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "left" },
    { "type": "text", "x": 80, "y": 205, "width": 210, "height": 60, "content": "Creative development, scripting, casting", "fontSize": 13, "fontWeight": "normal", "fontFamily": "Inter", "color": "#A3A3A3", "align": "left" },

    { "type": "shape", "shapeType": "rect", "x": 325, "y": 110, "width": 250, "height": 180, "color": "#18181B", "borderRadius": 8 },
    { "type": "shape", "shapeType": "rect", "x": 325, "y": 110, "width": 3, "height": 180, "color": "#C41E3A" },
    { "type": "text", "x": 345, "y": 125, "width": 210, "height": 20, "content": "PRODUCTION", "fontSize": 11, "fontWeight": "bold", "fontFamily": "JetBrains Mono", "color": "#C41E3A", "align": "left" },
    { "type": "text", "x": 345, "y": 155, "width": 210, "height": 40, "content": "$85,000", "fontSize": 32, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "left" },
    { "type": "text", "x": 345, "y": 205, "width": 210, "height": 60, "content": "4 film days, crew, equipment, talent", "fontSize": 13, "fontWeight": "normal", "fontFamily": "Inter", "color": "#A3A3A3", "align": "left" },

    { "type": "shape", "shapeType": "rect", "x": 590, "y": 110, "width": 250, "height": 180, "color": "#18181B", "borderRadius": 8 },
    { "type": "shape", "shapeType": "rect", "x": 590, "y": 110, "width": 3, "height": 180, "color": "#C41E3A" },
    { "type": "text", "x": 610, "y": 125, "width": 210, "height": 20, "content": "POST-PRODUCTION", "fontSize": 11, "fontWeight": "bold", "fontFamily": "JetBrains Mono", "color": "#C41E3A", "align": "left" },
    { "type": "text", "x": 610, "y": 155, "width": 210, "height": 40, "content": "$45,000", "fontSize": 32, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "left" },
    { "type": "text", "x": 610, "y": 205, "width": 210, "height": 60, "content": "Edit, color, sound, deliverables", "fontSize": 13, "fontWeight": "normal", "fontFamily": "Inter", "color": "#A3A3A3", "align": "left" },

    { "type": "shape", "shapeType": "rect", "x": 60, "y": 320, "width": 780, "height": 1, "color": "#27272A" },
    { "type": "text", "x": 60, "y": 350, "width": 300, "height": 25, "content": "TOTAL INVESTMENT", "fontSize": 13, "fontWeight": "bold", "fontFamily": "JetBrains Mono", "color": "#71717A", "align": "left" },
    { "type": "text", "x": 60, "y": 380, "width": 400, "height": 50, "content": "$165,000", "fontSize": 48, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "left" }
  ]
}

CLOSING EXAMPLE:
{
  "name": "Closing",
  "archetype": "MONOLITH",
  "background": { "color": "#000000" },
  "elements": [
    { "type": "text", "x": 100, "y": 140, "width": 700, "height": 60, "content": "THANK YOU", "fontSize": 56, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "center" },
    { "type": "shape", "shapeType": "rect", "x": 400, "y": 220, "width": 100, "height": 1, "color": "#C41E3A" },
    { "type": "text", "x": 150, "y": 250, "width": 600, "height": 50, "content": "We're excited about the opportunity to partner with you on this project.", "fontSize": 17, "fontWeight": "normal", "fontFamily": "Inter", "color": "#A3A3A3", "align": "center" },
    { "type": "text", "x": 650, "y": 420, "width": 200, "height": 40, "content": "VALIDATE", "fontSize": 32, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "right" }
  ]
}

NOTE: The closing slide should leave space at the bottom for contact information that will be added separately. Keep the main content in the top 2/3 of the slide.

DO NOT include images unless explicitly requested.

================================================================================
FINAL CHECK BEFORE OUTPUT (MANDATORY):
================================================================================
Before outputting each text element, verify:
1. Character count is within limit for the font size
2. Text will fit within its width and height
3. Element stays within safe zones (x >= 50, x + width <= 850, y >= 50, y + height <= 480)
4. No overlap with other elements

If ANY text is too long, SHORTEN IT. Do not output text that will be cut off.
Brevity is better than overflow. Less is more.

Return ONLY valid JSON with your designed slides. No markdown, no explanation.`;

// ============================================
// EXPIRATION MODAL
// CASE STUDY SYSTEM PROMPT
// ============================================
// EXPIRATION MODAL
const CASE_STUDY_SYSTEM_PROMPT = `${BRAND_GUIDELINES}

${DESIGN_RULES}

================================================================================
SLIDE LAYOUT OUTPUT FORMAT - CASE STUDY
================================================================================

You are not just providing content - you are DESIGNING each slide.
You are a Creative Director making layout decisions based on the design rules above.

CANVAS: 900x506 pixels, origin top-left (0,0).

================================================================================
CASE STUDY STRUCTURE (EXACTLY 2 SLIDES - NO MORE, NO LESS):
================================================================================

Your job is to distill the client's work into exactly 2 beautiful, impactful slides that sell their expertise.

1. SLIDE 1: THE STORY (MAGAZINE_SPREAD layout)
   - Project/client name as headline
   - "CASE STUDY" label in red accent
   - Combine the challenge and solution into a compelling narrative
   - What was the problem? What did they do? Keep it concise and powerful
   - Use pull quotes or key phrases that grab attention

2. SLIDE 2: THE RESULTS (DASHBOARD layout)
   - Big, bold metrics and outcomes
   - 2-3 key achievements with numbers if possible
   - Visual impact: large numbers, clear wins
   - A brief testimonial quote if provided
   - Make the success undeniable

CRITICAL: Output EXACTLY 2 slides. Not 3, not 4, not 1. Always 2.

================================================================================
LAYOUT ARCHETYPES:
================================================================================

MONOLITH: Single massive headline dominating the slide, vast negative space.
- Headline should use 60%+ of visual weight
- Minimal supporting elements, maximum breathing room

MAGAZINE_SPREAD: 40% text column + vast negative space.
- Narrow text column creates focus
- Strategic placement of bullet points

DASHBOARD: Complex modular zones with thin 1px dividers.
- Multiple cards/sections
- Thin line separators (#71717A, 1px height)
- Data-forward, organized zones

================================================================================
TYPOGRAPHY SIZES (use ONLY these - never in between):
================================================================================
56px: Hero headlines (cover title ONLY)
32px: Section titles ("THE CHALLENGE", "THE SOLUTION", "THE RESULTS")
20px: Card titles, option names
17px: Primary body text, descriptions
13px: Labels, secondary text
11px: MINIMUM - metadata, labels

RULE: Go HUGE or tiny. The 24-36px range is forbidden.

================================================================================
FONTS (STRICT RULES - NO EXCEPTIONS):
================================================================================

ONLY THREE FONTS ALLOWED. No other fonts. Ever.

"Bebas Neue" - THE HEADLINE FONT
  - Use for: Hero titles, section headers, large numbers, VALIDATE logo
  - Always: fontWeight "bold", UPPERCASE text
  - Sizes: 56px (hero), 48px (metrics), 32px (section titles)
  - Color: #FFFFFF only

"Inter" - THE BODY FONT
  - Use for: Descriptions, paragraphs, subtitles, body content
  - Always: fontWeight "normal"
  - Sizes: 17px (body), 15px (card descriptions), 13px (smaller descriptions)
  - Color: #D4D4D8 (light gray) or #A3A3A3 (muted)

"JetBrains Mono" - THE LABEL FONT
  - Use for: Labels, metadata, dates, client names, category headers
  - Always: fontWeight "normal", often UPPERCASE
  - Sizes: 13px (labels), 11px (metadata)
  - Color: #71717A (muted gray), #52525B (very muted), or #C41E3A (red labels)

================================================================================
COLORS:
================================================================================
#000000: Background (ALWAYS black)
#18181B: Card backgrounds (use with borderRadius: 8)
#FFFFFF: Headlines, important text
#D4D4D8: Body text (light gray)
#71717A: Muted/secondary, divider lines
#52525B: Very muted elements
#C41E3A: VALIDATE Red accent (thin bars, labels only, NEVER headlines)

================================================================================
ELEMENT TYPES:
================================================================================

TEXT ELEMENT:
{
  "type": "text",
  "x": 60,
  "y": 120,
  "width": 780,
  "height": 80,
  "content": "HEADLINE TEXT",
  "fontSize": 56,
  "fontWeight": "bold",
  "fontFamily": "Bebas Neue",
  "color": "#FFFFFF",
  "align": "left"
}

SHAPE ELEMENT (thin lines, accent bars, card backgrounds):
{
  "type": "shape",
  "shapeType": "rect",
  "x": 60,
  "y": 95,
  "width": 50,
  "height": 1,
  "color": "#71717A",
  "borderRadius": 0
}

For cards, use borderRadius: 8:
{
  "type": "shape",
  "shapeType": "rect",
  "x": 60,
  "y": 120,
  "width": 380,
  "height": 300,
  "color": "#18181B",
  "borderRadius": 8
}

================================================================================
CRITICAL LAYOUT RULES:
================================================================================

SAFE ZONES:
- Top margin: y >= 50
- Bottom margin: y + height <= 480 (leave 26px at bottom)
- Left margin: x >= 50
- Right margin: x + width <= 850

CARD CONTENT:
- Card background: #18181B (not #000000)
- Card padding: Content inside cards should be inset 20px from card edges
- Red accent bar: 3px wide, attached to left edge of card

================================================================================
OUTPUT FORMAT - EXAMPLE SLIDES (2 SLIDES TOTAL):
================================================================================

SLIDE 1 - THE STORY (combines intro, challenge, and solution):
{
  "name": "The Story",
  "archetype": "MAGAZINE_SPREAD",
  "background": { "color": "#000000" },
  "elements": [
    { "type": "text", "x": 60, "y": 50, "width": 200, "height": 20, "content": "CASE STUDY", "fontSize": 11, "fontWeight": "normal", "fontFamily": "JetBrains Mono", "color": "#C41E3A", "align": "left" },
    { "type": "text", "x": 60, "y": 80, "width": 700, "height": 70, "content": "PROJECT TITLE HERE", "fontSize": 48, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "left" },
    { "type": "text", "x": 60, "y": 155, "width": 300, "height": 20, "content": "CLIENT NAME • 2024", "fontSize": 11, "fontWeight": "normal", "fontFamily": "JetBrains Mono", "color": "#71717A", "align": "left" },
    { "type": "shape", "shapeType": "rect", "x": 60, "y": 190, "width": 60, "height": 1, "color": "#71717A" },
    { "type": "text", "x": 60, "y": 210, "width": 500, "height": 100, "content": "Compelling narrative combining the challenge and solution. What was the problem? What did they do? Keep it powerful and concise - 3-4 sentences max.", "fontSize": 17, "fontWeight": "normal", "fontFamily": "Inter", "color": "#D4D4D8", "align": "left" },
    { "type": "text", "x": 60, "y": 340, "width": 500, "height": 60, "content": "\"A powerful pull quote that captures the essence of the work.\"", "fontSize": 20, "fontWeight": "normal", "fontFamily": "Inter", "color": "#FFFFFF", "align": "left" },
    { "type": "text", "x": 700, "y": 420, "width": 150, "height": 40, "content": "VALIDATE", "fontSize": 24, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "right" }
  ]
}

SLIDE 2 - THE RESULTS (metrics and outcomes):
{
  "name": "The Results",
  "archetype": "DASHBOARD",
  "background": { "color": "#000000" },
  "elements": [
    { "type": "text", "x": 60, "y": 50, "width": 400, "height": 45, "content": "THE RESULTS", "fontSize": 32, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "left" },
    { "type": "shape", "shapeType": "rect", "x": 60, "y": 100, "width": 60, "height": 1, "color": "#71717A" },
    { "type": "shape", "shapeType": "rect", "x": 60, "y": 130, "width": 220, "height": 130, "color": "#18181B", "borderRadius": 8 },
    { "type": "text", "x": 80, "y": 150, "width": 180, "height": 55, "content": "150%", "fontSize": 48, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "left" },
    { "type": "text", "x": 80, "y": 210, "width": 180, "height": 35, "content": "Increase in engagement", "fontSize": 13, "fontWeight": "normal", "fontFamily": "Inter", "color": "#A3A3A3", "align": "left" },
    { "type": "shape", "shapeType": "rect", "x": 300, "y": 130, "width": 220, "height": 130, "color": "#18181B", "borderRadius": 8 },
    { "type": "text", "x": 320, "y": 150, "width": 180, "height": 55, "content": "2.5M", "fontSize": 48, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "left" },
    { "type": "text", "x": 320, "y": 210, "width": 180, "height": 35, "content": "Video views", "fontSize": 13, "fontWeight": "normal", "fontFamily": "Inter", "color": "#A3A3A3", "align": "left" },
    { "type": "shape", "shapeType": "rect", "x": 540, "y": 130, "width": 220, "height": 130, "color": "#18181B", "borderRadius": 8 },
    { "type": "text", "x": 560, "y": 150, "width": 180, "height": 55, "content": "45%", "fontSize": 48, "fontWeight": "bold", "fontFamily": "Bebas Neue", "color": "#FFFFFF", "align": "left" },
    { "type": "text", "x": 560, "y": 210, "width": 180, "height": 35, "content": "ROI improvement", "fontSize": 13, "fontWeight": "normal", "fontFamily": "Inter", "color": "#A3A3A3", "align": "left" },
    { "type": "text", "x": 60, "y": 290, "width": 700, "height": 80, "content": "\"The work exceeded our expectations and transformed how we connect with our audience.\"", "fontSize": 17, "fontWeight": "normal", "fontFamily": "Inter", "color": "#D4D4D8", "align": "left" },
    { "type": "text", "x": 60, "y": 375, "width": 300, "height": 20, "content": "— Client Name, Title", "fontSize": 13, "fontWeight": "normal", "fontFamily": "Inter", "color": "#71717A", "align": "left" }
  ]
}

================================================================================
CHARACTER LIMITS (HARD CAPS - NEVER EXCEED):
================================================================================
- 48px Bebas Neue: MAX 25 CHARACTERS
- 32px Bebas Neue: MAX 30 CHARACTERS
- 20px quotes: MAX 80 CHARACTERS per line (split to 2 lines if longer)
- 17px body text (500px wide): MAX 55 CHARACTERS per line
- 13px card descriptions (180px wide): MAX 25 CHARACTERS per line
- If content is longer: ABBREVIATE IT or split into multiple lines

================================================================================
CRITICAL RULES:
================================================================================
- Generate EXACTLY 2 slides, no more, no less
- Slide 1 = The Story (challenge + solution narrative)
- Slide 2 = The Results (metrics + testimonial)
- Every element needs type, x, y, width, height
- Text elements need: content, fontSize, fontWeight, fontFamily, color, align
- Shape elements need: shapeType, color, and optionally borderRadius
- Distill all info into these 2 impactful slides - be concise but powerful
- Use real numbers and specifics when provided
- DO NOT include images unless explicitly requested

FINAL CHECK: Before outputting, verify each text element's character count fits within its width. Shorten any text that would be cut off. Brevity is better than overflow.

Return ONLY valid JSON with your designed slides. No markdown, no explanation.`;

// ============================================
// EXPIRATION MODAL
// LAYOUT FORMAT DETECTION & FALLBACK
// ============================================
// EXPIRATION MODAL

// Detect if response is new layout format or old content-only format
function detectResponseFormat(parsed) {
  // New format: Has slides array with elements
  if (parsed.slides && Array.isArray(parsed.slides) && parsed.slides[0]?.elements) {
    return 'layout';
  }
  // Old format: Has cover, objective, etc. at top level
  if (parsed.cover || parsed.objective || parsed.options || parsed.investment) {
    return 'content';
  }
  return 'unknown';
}

// Extract content from layout format for fallback to proposalToSlides()
function extractContentFromLayout(layoutProposal) {
  const findTextBySize = (slide, minSize, maxSize) => {
    if (!slide?.elements) return '';
    const el = slide.elements.find(e =>
      e.type === 'text' && e.fontSize >= minSize && e.fontSize <= maxSize
    );
    return el?.content || '';
  };

  const findAllTextBySize = (slide, minSize, maxSize) => {
    if (!slide?.elements) return [];
    return slide.elements
      .filter(e => e.type === 'text' && e.fontSize >= minSize && e.fontSize <= maxSize)
      .map(e => e.content)
      .filter(Boolean);
  };

  const slides = layoutProposal.slides || [];
  const coverSlide = slides.find(s => s.name === 'Cover');
  const objectiveSlide = slides.find(s => s.name === 'Objective');
  const creativeSlide = slides.find(s => s.name === 'Creative Approach');
  const optionsSlide = slides.find(s => s.name === 'Options');
  const productionSlide = slides.find(s => s.name === 'Production');
  const investmentSlide = slides.find(s => s.name === 'Investment');
  const closingSlide = slides.find(s => s.name === 'Closing');

  return {
    cover: {
      headline: findTextBySize(coverSlide, 40, 60) || 'Project Title',
      clientName: findTextBySize(coverSlide, 10, 12),
      date: findTextBySize(coverSlide, 10, 12),
    },
    objective: {
      content: findTextBySize(objectiveSlide, 15, 20),
    },
    creativeApproach: creativeSlide ? {
      content: findTextBySize(creativeSlide, 15, 20),
      elements: findAllTextBySize(creativeSlide, 11, 14),
    } : null,
    options: optionsSlide ? [{
      name: findTextBySize(optionsSlide, 18, 22),
      description: findTextBySize(optionsSlide, 14, 17),
      investment: findTextBySize(optionsSlide, 10, 13),
      deliverables: findAllTextBySize(optionsSlide, 10, 13),
    }] : null,
    production: productionSlide ? {
      crew: findAllTextBySize(productionSlide, 12, 14),
      phases: [
        { number: '01', title: 'PRE-PRODUCTION', subtitle: 'Creative development' },
        { number: '02', title: 'PRINCIPAL PHOTOGRAPHY', subtitle: 'Production days' },
        { number: '03', title: 'POST-PRODUCTION', subtitle: 'Edit and delivery' },
      ],
    } : null,
    investment: investmentSlide ? {
      range: findTextBySize(investmentSlide, 40, 56) || findTextBySize(investmentSlide, 30, 40),
      phases: [
        { name: 'PRE-PRODUCTION & TALENT', description: 'Creative fees', items: ['Creative Development'] },
        { name: 'PRINCIPAL PRODUCTION', description: 'Shoot days', items: ['Director & DP Labor'] },
        { name: 'EDITORIAL & FINISHING', description: 'Post-production', items: ['Color grading'] },
      ],
    } : null,
    closing: closingSlide ? {
      content: findTextBySize(closingSlide, 15, 20),
    } : null,
  };
}

// Process AI-generated layout slides (add IDs, validate)
function processLayoutSlides(layoutProposal) {
  const slides = layoutProposal.slides || [];
  return slides.map(slide => ({
    ...slide,
    id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    background: slide.background || { color: '#000000' },
    elements: (slide.elements || []).map(el => ({
      ...el,
      id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    })),
  }));
}

// ============================================
// EXPIRATION MODAL
// SLIDE DATA CONVERSION
// ============================================
// EXPIRATION MODAL
const generateSlideId = () => `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateElementId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const COLORS = {
  black: '#000000',
  dark: '#0A0A0A',
  gray: '#71717A',      // Zinc-500 - readable, neutral
  text: '#D4D4D8',      // Zinc-300 - clear body text
  white: '#FFFFFF',
  accent: '#FFFFFF',
  muted: '#52525B',     // Zinc-600 - subtle elements
};

// TYPOGRAPHY HIERARCHY RULES:
// - 56px: Hero headlines (cover title)
// - 48px: Large display (logo)
// - 32px: Section titles ("ESTIMATED COST", "CREATIVE OPTIONS")
// - 28-30px: Large numbers, phase numbers
// - 20px: Option card titles
// - 18px: Important card headings (phase names like "GIVE AND BE PRODUCTION")
// - 15-17px: Primary body text, descriptions
// - 13px: Secondary labels ("TOTAL ESTIMATED COST")
// - 12px: Tertiary labels ("CREW & GEAR")
// - 11px: MINIMUM - footers, metadata, small body text
// NEVER use anything smaller than 11px

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 506;

// Convert proposal JSON to editable slide data
function proposalToSlides(proposal) {
  const slides = [];

  // Cover slide - clean, typographic
  slides.push({
    id: generateSlideId(),
    name: 'Cover',
    background: { color: COLORS.black, image: null, opacity: 1 },
    elements: [
      // Client name - subtle
      { id: generateElementId(), type: 'text', content: (proposal.cover?.clientName || 'CLIENT').toUpperCase(), x: 60, y: 60, width: 400, height: 24, fontSize: 11, fontWeight: 'normal', fontFamily: 'JetBrains Mono', color: COLORS.gray, align: 'left' },
      // Main headline - hero
      { id: generateElementId(), type: 'text', content: (proposal.cover?.headline || 'PROJECT TITLE').toUpperCase(), x: 60, y: 120, width: 780, height: 120, fontSize: 56, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.white, align: 'left' },
      // Date
      { id: generateElementId(), type: 'text', content: proposal.cover?.date || '', x: 60, y: 260, width: 200, height: 25, fontSize: 11, fontWeight: 'normal', fontFamily: 'JetBrains Mono', color: COLORS.muted, align: 'left' },
      // Thin accent line
      { id: generateElementId(), type: 'shape', shapeType: 'rect', x: 60, y: 310, width: 80, height: 1, color: COLORS.gray },
      // Proposal label
      { id: generateElementId(), type: 'text', content: 'CREATIVE SERVICES PROPOSAL', x: 60, y: 330, width: 300, height: 20, fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.gray, align: 'left' },
      // VALIDATE - bottom right, confident
      { id: generateElementId(), type: 'text', content: 'VALIDATE', x: 600, y: 450, width: 250, height: 40, fontSize: 28, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.white, align: 'right' },
    ]
  });
    
  // Objective slide
  if (proposal.objective?.content) {
    slides.push({
      id: generateSlideId(),
      name: 'Objective',
      background: { color: COLORS.black, image: null, opacity: 1 },
      elements: [
        // Title
        { id: generateElementId(), type: 'text', content: 'PROJECT OBJECTIVE', x: 60, y: 50, width: 500, height: 45, fontSize: 32, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.white, align: 'left' },
        { id: generateElementId(), type: 'shape', shapeType: 'rect', x: 60, y: 95, width: 50, height: 1, color: COLORS.gray },
        // Content
        { id: generateElementId(), type: 'text', content: proposal.objective.content, x: 60, y: 120, width: 780, height: 300, fontSize: 17, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.text, align: 'left' },
      ]
    });
      }
  
  // Creative Approach slide
  if (proposal.creativeApproach?.content) {
    const elements = [
      // Title
      { id: generateElementId(), type: 'text', content: 'CREATIVE APPROACH', x: 60, y: 50, width: 500, height: 45, fontSize: 32, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.white, align: 'left' },
      { id: generateElementId(), type: 'shape', shapeType: 'rect', x: 60, y: 95, width: 50, height: 1, color: COLORS.gray },
      // Content
      { id: generateElementId(), type: 'text', content: proposal.creativeApproach.content, x: 60, y: 120, width: 780, height: 100, fontSize: 15, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.text, align: 'left' },
    ];
    
    (proposal.creativeApproach.elements || []).slice(0, 6).forEach((el, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 60 + col * 400, y = 240 + row * 55;
      // Modern bullet (small circle) instead of em dash
      elements.push({ id: generateElementId(), type: 'shape', shapeType: 'ellipse', x, y: y + 6, width: 5, height: 5, color: COLORS.gray });
      elements.push({ id: generateElementId(), type: 'text', content: el, x: x + 16, y, width: 360, height: 45, fontSize: 13, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.text, align: 'left' });
    });

    slides.push({ id: generateSlideId(), name: 'Creative Approach', background: { color: COLORS.black, image: null, opacity: 1 }, elements });
      }
  
  // Options slide
  if (proposal.options?.length) {
    const elements = [
      { id: generateElementId(), type: 'text', content: 'CREATIVE OPTIONS', x: 60, y: 50, width: 500, height: 45, fontSize: 32, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.white, align: 'left' },
      { id: generateElementId(), type: 'shape', shapeType: 'rect', x: 60, y: 100, width: 80, height: 2, color: COLORS.white },
    ];
    
    const opts = proposal.options.slice(0, 2);
    const cardWidth = opts.length === 1 ? 780 : 380;
    
    opts.forEach((o, i) => {
      const x = 60 + i * 400;
      elements.push({ id: generateElementId(), type: 'shape', shapeType: 'rect', x, y: 120, width: cardWidth, height: 320, color: COLORS.dark });
      elements.push({ id: generateElementId(), type: 'shape', shapeType: 'rect', x, y: 120, width: 2, height: 320, color: COLORS.white });
      elements.push({ id: generateElementId(), type: 'text', content: (o.name || 'OPTION').toUpperCase(), x: x + 20, y: 130, width: cardWidth - 40, height: 35, fontSize: 20, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.white, align: 'left' });
      if (o.investment) elements.push({ id: generateElementId(), type: 'text', content: o.investment, x: x + 20, y: 165, width: cardWidth - 40, height: 25, fontSize: 11, fontWeight: 'normal', fontFamily: 'JetBrains Mono', color: COLORS.text, align: 'left' });
      if (o.tagline) elements.push({ id: generateElementId(), type: 'text', content: `"${o.tagline}"`, x: x + 20, y: 195, width: cardWidth - 40, height: 30, fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.text, align: 'left', fontStyle: 'italic' });
      if (o.description) elements.push({ id: generateElementId(), type: 'text', content: o.description, x: x + 20, y: 230, width: cardWidth - 40, height: 80, fontSize: 12, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.text, align: 'left' });
      
      (o.deliverables || []).slice(0, 6).forEach((d, j) => {
        const col = j % 2, row = Math.floor(j / 2);
        const dx = x + 20 + col * ((cardWidth - 40) / 2), dy = 320 + row * 35;
        // Modern bullet (small circle) instead of em dash
        elements.push({ id: generateElementId(), type: 'shape', shapeType: 'ellipse', x: dx, y: dy + 5, width: 4, height: 4, color: COLORS.white });
        elements.push({ id: generateElementId(), type: 'text', content: d, x: dx + 12, y: dy, width: (cardWidth - 60) / 2, height: 30, fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.text, align: 'left' });
      });
    });

    slides.push({ id: generateSlideId(), name: 'Options', background: { color: COLORS.black, image: null, opacity: 1 }, elements });
      }
  
  // Production slide
  if (proposal.production) {
    const elements = [
      { id: generateElementId(), type: 'text', content: 'THE PRODUCTION', x: 60, y: 50, width: 500, height: 45, fontSize: 32, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.white, align: 'left' },
      { id: generateElementId(), type: 'shape', shapeType: 'rect', x: 60, y: 100, width: 80, height: 2, color: COLORS.white },
      { id: generateElementId(), type: 'text', content: 'CREW & GEAR', x: 60, y: 125, width: 150, height: 25, fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter', color: COLORS.white, align: 'left' },
    ];
    
    (proposal.production.crew || []).slice(0, 5).forEach((c, i) => {
      elements.push({ id: generateElementId(), type: 'text', content: c, x: 60, y: 155 + i * 28, width: 300, height: 25, fontSize: 13, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.text, align: 'left' });
    });
    
    (proposal.production.gear || []).slice(0, 5).forEach((g, i) => {
      elements.push({ id: generateElementId(), type: 'text', content: `• ${g}`, x: 60, y: 310 + i * 25, width: 300, height: 22, fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.gray, align: 'left', fontStyle: 'italic' });
    });
    
    (proposal.production.phases || []).slice(0, 4).forEach((p, i) => {
      const y = 125 + i * 90;
      elements.push({ id: generateElementId(), type: 'text', content: p.number || `0${i + 1}`, x: 420, y, width: 60, height: 45, fontSize: 30, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.white, align: 'left' });
      elements.push({ id: generateElementId(), type: 'text', content: (p.title || '').toUpperCase(), x: 490, y, width: 350, height: 30, fontSize: 15, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.white, align: 'left' });
      if (p.subtitle || p.description) elements.push({ id: generateElementId(), type: 'text', content: p.subtitle || p.description, x: 490, y: y + 30, width: 350, height: 25, fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.text, align: 'left' });
      if (i < (proposal.production.phases || []).length - 1) elements.push({ id: generateElementId(), type: 'shape', shapeType: 'rect', x: 420, y: y + 75, width: 420, height: 1, color: COLORS.gray });
    });

    slides.push({ id: generateSlideId(), name: 'Production', background: { color: COLORS.black, image: null, opacity: 1 }, elements });
      }
  
  // Investment slide - ALWAYS includes pre-production, production, post-production breakdown
  if (proposal.investment) {
    const elements = [
      // Consistent header style - upper left, bold headline with underline
      { id: generateElementId(), type: 'text', content: 'ESTIMATED COST', x: 60, y: 50, width: 500, height: 45, fontSize: 32, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.white, align: 'left' },
      { id: generateElementId(), type: 'shape', shapeType: 'rect', x: 60, y: 95, width: 50, height: 1, color: COLORS.gray },
    ];

    // Default phases if AI didn't provide them - ensures we ALWAYS have the three-phase breakdown
    const defaultPhases = [
      { name: 'PRE-PRODUCTION & TALENT', description: 'Creative development and logistics management.', items: ['Creative Development', 'Location Permits', 'Travel Coordination'] },
      { name: 'PRINCIPAL PRODUCTION', description: 'Principal photography across locations.', items: ['Director & DP Labor', 'Camera Packages', 'Crew Operations'] },
      { name: 'EDITORIAL & FINISHING', description: 'Comprehensive editorial and finishing suite.', items: ['Color Grading', 'Sound Design', 'Final Deliverables'] }
    ];

    const phases = (proposal.investment.phases && proposal.investment.phases.length >= 3)
      ? proposal.investment.phases.slice(0, 3)
      : defaultPhases;

    phases.forEach((p, i) => {
      const x = 60 + i * 275, cardW = 260, cardY = 120;
      // Card background with rounded corners
      elements.push({ id: generateElementId(), type: 'shape', shapeType: 'rect', x, y: cardY, width: cardW, height: 220, color: COLORS.dark, borderRadius: 8 });
      // Left accent bar (red)
      elements.push({ id: generateElementId(), type: 'shape', shapeType: 'rect', x, y: cardY, width: 3, height: 220, color: COLORS.accent });
      // Phase header in RED accent color
      elements.push({ id: generateElementId(), type: 'text', content: (p.name || '').toUpperCase(), x: x + 18, y: cardY + 15, width: cardW - 30, height: 30, fontSize: 16, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.accent, align: 'left' });
      // Description in gray
      if (p.description && p.description.length < 100) {
        elements.push({ id: generateElementId(), type: 'text', content: p.description, x: x + 18, y: cardY + 45, width: cardW - 35, height: 50, fontSize: 12, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.gray, align: 'left' });
      }

      // Line items with em-dash bullets
      (p.items || []).slice(0, 4).forEach((item, j) => {
        elements.push({ id: generateElementId(), type: 'text', content: '—', x: x + 18, y: cardY + 95 + j * 28, width: 20, height: 24, fontSize: 12, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.gray, align: 'left' });
        elements.push({ id: generateElementId(), type: 'text', content: item, x: x + 38, y: cardY + 95 + j * 28, width: cardW - 55, height: 24, fontSize: 12, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.text, align: 'left' });
      });
    });

    // Total section - white card at bottom like in reference design
    elements.push({ id: generateElementId(), type: 'shape', shapeType: 'rect', x: 60, y: 360, width: 780, height: 90, color: '#FFFFFF', borderRadius: 8 });
    // Red left accent bar on total card
    elements.push({ id: generateElementId(), type: 'shape', shapeType: 'rect', x: 60, y: 360, width: 4, height: 90, color: COLORS.accent });

    // Label on the left (dark text on white background)
    elements.push({ id: generateElementId(), type: 'text', content: 'TOTAL ESTIMATED INVESTMENT', x: 80, y: 380, width: 350, height: 30, fontSize: 18, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.black, align: 'left' });

    // Note/subtitle if useful
    const note = proposal.investment.note || 'Presented as a range based on selected creative scope';
    const isUsefulNote = note && note.length < 80 && !note.toLowerCase().includes('maximiz') && !note.toLowerCase().includes('efficien') && !note.toLowerCase().includes('strategic');
    if (isUsefulNote) {
      elements.push({ id: generateElementId(), type: 'text', content: note, x: 80, y: 410, width: 350, height: 30, fontSize: 12, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.muted, align: 'left' });
    }

    // Investment amount - right aligned, bold black on white
    const investmentText = proposal.investment.range || proposal.investment.amount || '$0';
    elements.push({ id: generateElementId(), type: 'text', content: investmentText, x: 450, y: 375, width: 370, height: 60, fontSize: 48, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.black, align: 'right' });
    
    slides.push({ id: generateSlideId(), name: 'Investment', background: { color: COLORS.black, image: null, opacity: 1 }, elements });
      }
  
  // Closing slide - elegant, centered
  if (proposal.closing?.content) {
    slides.push({
      id: generateSlideId(),
      name: 'Closing',
      background: { color: COLORS.black, image: null, opacity: 1 },
      elements: [
        // Thin accent line top
        { id: generateElementId(), type: 'shape', shapeType: 'rect', x: 400, y: 80, width: 100, height: 1, color: COLORS.gray },
        // Message content
        { id: generateElementId(), type: 'text', content: proposal.closing.content, x: 100, y: 140, width: 700, height: 160, fontSize: 18, fontWeight: 'normal', fontFamily: 'Inter', color: COLORS.text, align: 'center' },
        // VALIDATE - confident, centered
        { id: generateElementId(), type: 'text', content: 'VALIDATE', x: 250, y: 340, width: 400, height: 60, fontSize: 48, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.white, align: 'center' },
        // Thin accent line bottom
        { id: generateElementId(), type: 'shape', shapeType: 'rect', x: 400, y: 410, width: 100, height: 1, color: COLORS.gray },
      ]
    });
  }
  
  return slides;
}

// ============================================
// EXPIRATION MODAL
// MAIN COMPONENT
// ============================================
// EXPIRATION MODAL
export default function ValidateProposalMachine() {
  const isMobile = useIsMobile();
  const [proposal, setProposal] = useState(null);
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementIds, setSelectedElementIds] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState(null);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [inputCollapsed, setInputCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [saveStatus, setSaveStatus] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [clients, setClients] = useState([]);
  const [showProjectBrowser, setShowProjectBrowser] = useState(false);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [deletedProjects, setDeletedProjects] = useState([]); // Trash for deleted projects
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [imagePickerMode, setImagePickerMode] = useState('element'); // 'element' or 'background'
  const [libraryImages, setLibraryImages] = useState([]); // Images from library for AI chat access
  const [libraryFolders, setLibraryFolders] = useState([]); // Folders from library for AI chat access
  const [originalNotes, setOriginalNotes] = useState(''); // Original notes provided when proposal was created
  const [croppingElement, setCroppingElement] = useState(null);
  const [editingBackground, setEditingBackground] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  // Case Study state
  const [caseStudies, setCaseStudies] = useState([]); // Global case study library
  const [showCaseStudyLibrary, setShowCaseStudyLibrary] = useState(false);
  const [caseStudyLibraryMode, setCaseStudyLibraryMode] = useState('browse'); // 'browse' | 'insert'
  const [editingMode, setEditingMode] = useState(null); // 'proposal' | 'caseStudy' | null
  const [currentCaseStudyId, setCurrentCaseStudyId] = useState(null);

  // Share state
  const [showShareModal, setShowShareModal] = useState(false);

  // Export PDF modal state
  const [showExportModal, setShowExportModal] = useState(false);

  // Proposal expiration state
  const [proposalExpirationDays, setProposalExpirationDays] = useState(null); // null = no expiration set
  const [showExpirationModal, setShowExpirationModal] = useState(false);

  // Mobile-specific state
  const [mobileInputOpen, setMobileInputOpen] = useState(false);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);

  // Undo/Redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyIndexRef = useRef(-1); // Keep ref in sync to avoid stale closures
  const isUndoingRef = useRef(false);
  const MAX_HISTORY = 50; // Support at least 20+ undo steps

  // BULLETPROOF: Compute safe slide index - always clamp to valid range
  const safeSlideIndex = slides.length === 0 ? 0 : Math.min(Math.max(0, currentSlideIndex), slides.length - 1);
  const currentSlide = slides[safeSlideIndex];
  // For editor panel, use first selected element (single-edit mode)
  const selectedElement = selectedElementIds.length > 0
    ? currentSlide?.elements?.find(el => el.id === selectedElementIds[0])
    : null;

  // Auto-correct currentSlideIndex if it goes out of bounds
  useEffect(() => {
    if (slides.length > 0 && currentSlideIndex >= slides.length) {
      setCurrentSlideIndex(slides.length - 1);
    }
  }, [slides.length, currentSlideIndex]);

  // Debounce timer for history
  const historyTimeoutRef = useRef(null);
  const pendingSlidesRef = useRef(null);

  // Keep historyIndexRef in sync with historyIndex state
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  // Track slide changes for undo - debounced to batch rapid changes - BULLETPROOF
  const pushHistory = useCallback((newSlides) => {
    if (isUndoingRef.current) return;

    // Validate newSlides before storing
    if (!newSlides || !Array.isArray(newSlides)) {
      console.warn('pushHistory: Invalid slides data, skipping', newSlides);
      return;
    }

    // Store pending slides
    pendingSlidesRef.current = newSlides;

    // Clear existing timeout
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }

    // Debounce - only push to history after 500ms of no changes
    historyTimeoutRef.current = setTimeout(() => {
      if (pendingSlidesRef.current && Array.isArray(pendingSlidesRef.current)) {
        try {
          const serialized = JSON.stringify(pendingSlidesRef.current);

          // Validate the serialization worked
          if (!serialized || serialized === 'null' || serialized === 'undefined') {
            console.warn('pushHistory: Serialization produced invalid result');
            pendingSlidesRef.current = null;
            return;
          }

          setHistory(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            // Use ref for current index to avoid stale closure
            const safeIndex = typeof historyIndexRef.current === 'number' ? historyIndexRef.current : -1;
            // Truncate any "future" history when making new changes (standard undo/redo behavior)
            const newHistory = safePrev.slice(0, safeIndex + 1);
            newHistory.push(serialized);
            if (newHistory.length > MAX_HISTORY) {
              newHistory.shift();
            }
            return newHistory;
          });
          setHistoryIndex(prev => {
            const newIndex = Math.min((typeof prev === 'number' ? prev : -1) + 1, MAX_HISTORY - 1);
            historyIndexRef.current = newIndex; // Keep ref in sync
            return newIndex;
          });
        } catch (e) {
          console.error('pushHistory: Serialization error', e);
        }
        pendingSlidesRef.current = null;
      }
    }, 500);
  }, []); // No dependencies needed - uses refs for current values

  // Wrapper for setSlides that tracks history
  const updateSlides = useCallback((newSlidesOrUpdater) => {
    if (isUndoingRef.current) {
      setSlides(newSlidesOrUpdater);
      return;
    }
    
    setSlides(prev => {
      const newSlides = typeof newSlidesOrUpdater === 'function' 
        ? newSlidesOrUpdater(prev) 
        : newSlidesOrUpdater;
      
      // Schedule debounced history push
      pushHistory(newSlides);
      
      return newSlides;
    });
  }, [pushHistory]);

  // Undo function - BULLETPROOF
  const undo = useCallback(() => {
    // Validate we can undo
    if (historyIndex <= 0 || !history || history.length === 0) return;

    // Clear any pending history push
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
      pendingSlidesRef.current = null;
    }

    const newIndex = historyIndex - 1;

    // Safety check for history entry
    if (newIndex < 0 || !history[newIndex]) {
      console.warn('Undo: Invalid history index or missing entry', { newIndex, historyLength: history.length });
      return;
    }

    isUndoingRef.current = true;

    try {
      const previousState = JSON.parse(history[newIndex]);

      // Validate the parsed state is a valid slides array
      if (!Array.isArray(previousState)) {
        console.error('Undo: Parsed state is not an array');
        isUndoingRef.current = false;
        return;
      }

      // Ensure we have at least one slide, or create empty array
      const validState = previousState.length > 0 ? previousState : [];

      setSlides(validState);
      setHistoryIndex(newIndex);
      historyIndexRef.current = newIndex; // Keep ref in sync
      setSelectedElementIds([]);

      // Ensure currentSlideIndex is valid for the restored state (handle empty array)
      setCurrentSlideIndex(prev => {
        if (validState.length === 0) return 0;
        return Math.min(Math.max(0, prev), validState.length - 1);
      });
    } catch (e) {
      console.error('Undo parse error:', e);
      // Don't leave in broken state - just log and return
      isUndoingRef.current = false;
      return;
    }

    // Reset flag after state update
    setTimeout(() => { isUndoingRef.current = false; }, 0);
  }, [history, historyIndex]);

  // Redo function - BULLETPROOF
  const redo = useCallback(() => {
    // Validate we can redo
    if (!history || history.length === 0 || historyIndex >= history.length - 1) return;

    // Clear any pending history push
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
      pendingSlidesRef.current = null;
    }

    const newIndex = historyIndex + 1;

    // Safety check for history entry
    if (newIndex >= history.length || !history[newIndex]) {
      console.warn('Redo: Invalid history index or missing entry', { newIndex, historyLength: history.length });
      return;
    }

    isUndoingRef.current = true;

    try {
      const nextState = JSON.parse(history[newIndex]);

      // Validate the parsed state is a valid slides array
      if (!Array.isArray(nextState)) {
        console.error('Redo: Parsed state is not an array');
        isUndoingRef.current = false;
        return;
      }

      // Ensure we have at least one slide, or create empty array
      const validState = nextState.length > 0 ? nextState : [];

      setSlides(validState);
      setHistoryIndex(newIndex);
      historyIndexRef.current = newIndex; // Keep ref in sync
      setSelectedElementIds([]);

      // Ensure currentSlideIndex is valid for the restored state (handle empty array)
      setCurrentSlideIndex(prev => {
        if (validState.length === 0) return 0;
        return Math.min(Math.max(0, prev), validState.length - 1);
      });
    } catch (e) {
      console.error('Redo parse error:', e);
      isUndoingRef.current = false;
      return;
    }

    // Reset flag after state update
    setTimeout(() => { isUndoingRef.current = false; }, 0);
  }, [history, historyIndex]);

  // Safe computed values for undo/redo availability
  const canUndo = Array.isArray(history) && history.length > 0 && historyIndex > 0;
  const canRedo = Array.isArray(history) && history.length > 0 && historyIndex < history.length - 1;

  // Load clients and projects on mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        // SUPABASE IS THE ONLY SOURCE OF TRUTH - no localStorage
        const supabaseClients = await projectStorage.loadClientsIndex();

        if (supabaseClients) {
          setClients(supabaseClients);

          // Load deleted projects from Supabase
          let deleted = await projectStorage.loadDeletedProjects();
          if (deleted && deleted.length > 0) {
            setDeletedProjects(deleted);
          }
          return;
        }

        // No data in Supabase, initialize with demo data
        initDemoData();
      } catch (e) {
        console.error('Failed to load clients:', e);
        // If Supabase fails, initialize with demos
        initDemoData();
      }
    };

    const initDemoData = async () => {
      const demoClients = [
        {
          id: 'client-sdc',
          name: 'Silver Dollar City',
          archived: false,
          createdAt: '2025-12-01T00:00:00Z',
          projects: [
            { id: 'demo-1', name: 'An Old Time Christmas', updatedAt: '2025-12-18T14:30:00Z', slideCount: 3, archived: false }
          ]
        },
        {
          id: 'client-bcl',
          name: 'Big Cedar Lodge',
          archived: false,
          createdAt: '2025-11-15T00:00:00Z',
          projects: [
            { id: 'demo-2', name: 'Top of the Rock Campaign', updatedAt: '2025-12-15T10:00:00Z', slideCount: 2, archived: false }
          ]
        },
        {
          id: 'client-branson',
          name: 'Branson Tourism',
          archived: false,
          createdAt: '2025-10-01T00:00:00Z',
          projects: [
            { id: 'demo-3', name: 'Spring Festival', updatedAt: '2025-12-10T09:15:00Z', slideCount: 2, archived: false }
          ]
        }
      ];

      setClients(demoClients);
      // Save to Supabase only
      await projectStorage.saveClientsIndex(demoClients);

      // Save demo project data
      await initDemoProjectData();
    };

    loadClients();
  }, []);

  // Load case studies on mount
  useEffect(() => {
    const loadCaseStudies = async () => {
      try {
        const response = await fetch(`/api/storage?path=${encodeURIComponent('case-studies/index.json')}`);
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data)) {
            setCaseStudies(data);
          }
        }
      } catch (err) {
        console.error('Failed to load case studies:', err);
      }
    };
    loadCaseStudies();
  }, []);

  // Load image library on mount for AI chat access
  useEffect(() => {
    const loadLibraryForChat = async () => {
      try {
        // Load folders from Supabase only
        let loadedFolders = await projectStorage.loadFolders();
        loadedFolders = loadedFolders || [];

        // List files from Supabase
        const SUPABASE_URL_LOCAL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const SUPABASE_KEY_LOCAL = process.env.NEXT_PUBLIC_SUPABASE_KEY;
        const STORAGE_BUCKET_LOCAL = 'validate-images';

        const response = await fetch(
          `${SUPABASE_URL_LOCAL}/storage/v1/object/list/${STORAGE_BUCKET_LOCAL}`,
          {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY_LOCAL,
              'Authorization': `Bearer ${SUPABASE_KEY_LOCAL}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prefix: '', limit: 1000 })
          }
        );

        if (!response.ok) return;

        const files = await response.json();

        // Load metadata from Supabase only
        let metadata = await projectStorage.loadImageMeta();
        metadata = metadata || {};

        const getPublicUrl = (path) =>
          `${SUPABASE_URL_LOCAL}/storage/v1/object/public/${STORAGE_BUCKET_LOCAL}/${path}`;

        // Map to image objects
        const loadedImages = files
          .filter(f => f.name && !f.name.endsWith('/') && f.name !== '.emptyFolderPlaceholder')
          .map(f => ({
            id: f.name,
            name: metadata[f.name]?.displayName || f.name,
            folderId: metadata[f.name]?.folderId || null,
            path: f.name,
            url: getPublicUrl(f.name),
            thumbnail: getPublicUrl(f.name),
            createdAt: f.created_at || new Date().toISOString(),
            size: f.metadata?.size || 0
          }));

        setLibraryImages(loadedImages);
        setLibraryFolders(loadedFolders || []);
      } catch (e) {
        console.log('Failed to preload image library for AI chat:', e);
      }
    };

    loadLibraryForChat();
  }, []);

  // Initialize demo project data
  const initDemoProjectData = async () => {
    const demo1Slides = [
      { id: 'demo1-slide1', name: 'Cover', background: { color: '#000000' }, elements: [
        { id: 'd1e1', type: 'text', content: 'SILVER DOLLAR CITY', x: 60, y: 60, width: 400, height: 24, fontSize: 11, fontWeight: 'normal', fontFamily: 'JetBrains Mono', color: '#71717A', align: 'left' },
        { id: 'd1e2', type: 'text', content: 'AN OLD TIME CHRISTMAS', x: 60, y: 120, width: 780, height: 120, fontSize: 56, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: '#FFFFFF', align: 'left' },
        { id: 'd1e3', type: 'text', content: 'December 18, 2025', x: 60, y: 260, width: 200, height: 25, fontSize: 11, fontWeight: 'normal', fontFamily: 'JetBrains Mono', color: '#52525B', align: 'left' },
        { id: 'd1e4', type: 'shape', shapeType: 'rect', x: 60, y: 310, width: 80, height: 1, color: '#71717A' },
        { id: 'd1e5', type: 'text', content: 'CREATIVE SERVICES PROPOSAL', x: 60, y: 330, width: 300, height: 20, fontSize: 11, fontWeight: 'normal', fontFamily: 'Inter', color: '#71717A', align: 'left' },
        { id: 'd1e6', type: 'text', content: 'VALIDATE', x: 600, y: 450, width: 250, height: 40, fontSize: 28, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: '#FFFFFF', align: 'right' },
      ]},
      { id: 'demo1-slide2', name: 'Objective', background: { color: '#000000' }, elements: [
        { id: 'd1e10', type: 'text', content: 'PROJECT OBJECTIVE', x: 60, y: 50, width: 500, height: 45, fontSize: 32, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: '#FFFFFF', align: 'left' },
        { id: 'd1e11', type: 'shape', shapeType: 'rect', x: 60, y: 95, width: 50, height: 1, color: '#71717A' },
        { id: 'd1e12', type: 'text', content: 'Capture the magic of Silver Dollar City\'s An Old Time Christmas celebration through cinematic brand films showcasing warmth, wonder, and timeless traditions.', x: 60, y: 120, width: 780, height: 300, fontSize: 17, fontWeight: 'normal', fontFamily: 'Inter', color: '#D4D4D8', align: 'left' },
      ]},
      { id: 'demo1-slide3', name: 'Investment', background: { color: '#000000' }, elements: [
        { id: 'd1e20', type: 'text', content: 'ESTIMATED COST', x: 60, y: 50, width: 500, height: 45, fontSize: 32, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: '#FFFFFF', align: 'left' },
        { id: 'd1e21', type: 'shape', shapeType: 'rect', x: 60, y: 95, width: 50, height: 1, color: '#71717A' },
        { id: 'd1e22', type: 'shape', shapeType: 'rect', x: 60, y: 360, width: 780, height: 1, color: '#71717A' },
        { id: 'd1e23', type: 'text', content: 'TOTAL ESTIMATED COST', x: 60, y: 380, width: 300, height: 30, fontSize: 13, fontWeight: 'normal', fontFamily: 'JetBrains Mono', color: '#71717A', align: 'left' },
        { id: 'd1e24', type: 'text', content: '$35,000 - $55,000', x: 400, y: 375, width: 440, height: 60, fontSize: 32, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: '#FFFFFF', align: 'right' },
      ]}
    ];
    
    const demo1Data = { slides: demo1Slides, projectName: 'An Old Time Christmas', clientName: 'Silver Dollar City', savedAt: '2025-12-18T10:30:00Z' };
    const demo2Data = { slides: demo1Slides.slice(0,2), projectName: 'Top of the Rock Campaign', clientName: 'Big Cedar Lodge', savedAt: '2025-12-15T14:20:00Z' };
    const demo3Data = { slides: demo1Slides.slice(0,2), projectName: 'Spring Festival', clientName: 'Branson Tourism', savedAt: '2025-12-10T09:15:00Z' };

    // Save to Supabase only
    await Promise.all([
      projectStorage.saveProject('demo-1', demo1Data),
      projectStorage.saveProject('demo-2', demo2Data),
      projectStorage.saveProject('demo-3', demo3Data)
    ]);
  };

  // Refs to track latest values for auto-save
  const slidesRef = useRef(slides);
  const projectNameRef = useRef(projectName);
  const clientNameRef = useRef(clientName);
  const clientsRef = useRef(clients);
  const currentProjectIdRef = useRef(currentProjectId);
  const originalNotesRef = useRef(originalNotes);
  const expirationDaysRef = useRef(proposalExpirationDays);
  const contactNameRef = useRef(contactName);
  const contactEmailRef = useRef(contactEmail);
  const contactPhoneRef = useRef(contactPhone);

  // Keep refs updated
  useEffect(() => { slidesRef.current = slides; }, [slides]);
  useEffect(() => { projectNameRef.current = projectName; }, [projectName]);
  useEffect(() => { clientNameRef.current = clientName; }, [clientName]);
  useEffect(() => { clientsRef.current = clients; }, [clients]);
  useEffect(() => { currentProjectIdRef.current = currentProjectId; }, [currentProjectId]);
  useEffect(() => { originalNotesRef.current = originalNotes; }, [originalNotes]);
  useEffect(() => { expirationDaysRef.current = proposalExpirationDays; }, [proposalExpirationDays]);
  useEffect(() => { contactNameRef.current = contactName; }, [contactName]);
  useEffect(() => { contactEmailRef.current = contactEmail; }, [contactEmail]);
  useEffect(() => { contactPhoneRef.current = contactPhone; }, [contactPhone]);

  // Auto-save current project every 60 seconds
  useEffect(() => {
    const saveData = async () => {
      const currentSlides = slidesRef.current;
      const currentName = projectNameRef.current;
      const currentClient = clientNameRef.current;
      const currentClients = clientsRef.current;
      const projectId = currentProjectIdRef.current;
      const currentOriginalNotes = originalNotesRef.current;
      const currentExpirationDays = expirationDaysRef.current;
      const currentContactName = contactNameRef.current;
      const currentContactEmail = contactEmailRef.current;
      const currentContactPhone = contactPhoneRef.current;

      if (!currentSlides.length || !projectId) return;

      try {
        setSaveStatus('saving');
        const projectData = {
          slides: currentSlides,
          projectName: currentName,
          clientName: currentClient,
          originalNotes: currentOriginalNotes,
          expirationDays: currentExpirationDays,
          contactName: currentContactName,
          contactEmail: currentContactEmail,
          contactPhone: currentContactPhone,
          savedAt: new Date().toISOString()
        };

        // Save to Supabase only
        await projectStorage.saveProject(projectId, projectData);

        // IMPORTANT: Fetch latest clients from Supabase to avoid overwriting others' projects
        let latestClients = await projectStorage.loadClientsIndex();
        if (!latestClients) latestClients = currentClients;

        // Update clients index - merge with latest from Supabase
        const updatedClients = latestClients.map(client => {
          const projectInClient = client.projects.find(p => p.id === projectId);
          if (projectInClient) {
            return {
              ...client,
              projects: client.projects.map(p =>
                p.id === projectId
                  ? { ...p, name: currentName, updatedAt: new Date().toISOString(), slideCount: currentSlides.length }
                  : p
              )
            };
          }
          return client;
        });
        setClients(updatedClients);
        // Save clients to Supabase only
        await projectStorage.saveClientsIndex(updatedClients);

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      } catch (e) {
        console.error('Save failed:', e);
        setSaveStatus('error');
      }
    };
    
    // Save every 60 seconds
    const saveInterval = setInterval(saveData, 60000);
    
    return () => {
      clearInterval(saveInterval);
    };
  }, []); // Run once on mount

  // Load a specific project
  const loadProject = async (projectId, loadedClientName = null) => {
    // Save current work before loading different project
    if (slides.length && currentProjectId && currentProjectId !== projectId) {
      try {
        const saveData = {
          slides,
          projectName,
          clientName,
          originalNotes,
          expirationDays: proposalExpirationDays,
          contactName,
          contactEmail,
          contactPhone,
          savedAt: new Date().toISOString()
        };
        // Save to Supabase only
        await projectStorage.saveProject(currentProjectId, saveData);
      } catch (e) {
        console.error('Save before load failed:', e);
      }
    }

    try {
      // Load from Supabase only
      let data = await projectStorage.loadProject(projectId);

      if (data) {
        const loadedSlides = data.slides || [];
        setSlides(loadedSlides);
        setHistory([JSON.stringify(loadedSlides)]);
        setHistoryIndex(0);
        setProjectName(data.projectName || '');
        setClientName(loadedClientName || data.clientName || '');
        setOriginalNotes(data.originalNotes || '');
        setProposalExpirationDays(data.expirationDays || null);
        setContactName(data.contactName || '');
        setContactEmail(data.contactEmail || '');
        setContactPhone(data.contactPhone || '');
        setCurrentProjectId(projectId);
        setEditingMode('proposal'); // Loading a project means editing a proposal
        setCurrentCaseStudyId(null);
        setInputCollapsed(true);
        setCurrentSlideIndex(0);
        setSelectedElementIds([]);
        setShowProjectBrowser(false);
      } else {
        setError('Could not find project data');
      }
    } catch (e) {
      console.error('Load project error:', e);
      setError('Could not load project');
    }
  };

  // Save as new project (with client)
  const saveAsNewProject = async (newName, newClientName) => {
    try {
      const newId = `project-${Date.now()}`;
      const clientId = newClientName ? `client-${newClientName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}` : null;

      const projectData = {
        slides,
        projectName: newName,
        clientName: newClientName,
        originalNotes,
        contactName,
        contactEmail,
        contactPhone,
        savedAt: new Date().toISOString()
      };

      // Save to Supabase only
      await projectStorage.saveProject(newId, projectData);

      // IMPORTANT: Fetch latest clients from Supabase first to avoid overwriting others' projects
      let latestClients = await projectStorage.loadClientsIndex();
      if (!latestClients) latestClients = clients; // fallback to local

      // Find or create client
      let updatedClients = [...latestClients];
      let existingClient = updatedClients.find(c => c.name.toLowerCase() === newClientName?.toLowerCase());

      if (existingClient) {
        // Add to existing client
        existingClient.projects = [
          { id: newId, name: newName, updatedAt: new Date().toISOString(), slideCount: slides.length, archived: false },
          ...existingClient.projects
        ];
      } else if (newClientName) {
        // Create new client
        updatedClients.unshift({
          id: clientId,
          name: newClientName,
          archived: false,
          createdAt: new Date().toISOString(),
          projects: [
            { id: newId, name: newName, updatedAt: new Date().toISOString(), slideCount: slides.length, archived: false }
          ]
        });
      }

      setClients(updatedClients);
      // Save to Supabase only
      await projectStorage.saveClientsIndex(updatedClients);

      setCurrentProjectId(newId);
      setProjectName(newName);
      setClientName(newClientName || '');
      setShowSaveAs(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (e) {
      setError('Could not save project');
    }
  };

  // Move project to trash (soft delete)
  const deleteProject = async (clientId, projectId) => {
    try {
      // Find the project and client info before removing
      const client = clients.find(c => c.id === clientId);
      const project = client?.projects.find(p => p.id === projectId);

      if (!project) return;

      // Add to deleted projects with original client info
      const deletedProject = {
        ...project,
        clientId,
        clientName: client.name,
        deletedAt: new Date().toISOString()
      };
      const updatedDeleted = [deletedProject, ...deletedProjects];
      setDeletedProjects(updatedDeleted);
      // Save to Supabase only
      await projectStorage.saveDeletedProjects(updatedDeleted);

      // IMPORTANT: Fetch latest clients from Supabase to avoid overwriting others' projects
      let latestClients = await projectStorage.loadClientsIndex();
      if (!latestClients) latestClients = clients;

      // Remove from clients list
      const updatedClients = latestClients.map(c => {
        if (c.id === clientId) {
          return { ...c, projects: c.projects.filter(p => p.id !== projectId) };
        }
        return c;
      }).filter(c => c.projects.length > 0); // Remove empty clients

      setClients(updatedClients);
      await projectStorage.saveClientsIndex(updatedClients);

      if (currentProjectId === projectId) {
        setSlides([]);
        setProjectName('');
        setClientName('');
        setCurrentProjectId(null);
        setInputCollapsed(false);
      }
    } catch (e) {
      setError('Could not delete project');
    }
  };

  // Duplicate a project
  const duplicateProject = async (clientId, projectId) => {
    try {
      // Load the project data
      const projectData = await projectStorage.loadProject(projectId);
      if (!projectData) {
        setError('Could not load project to duplicate');
        return;
      }

      // Find the client and original project entry
      const client = clients.find(c => c.id === clientId);
      const originalProject = client?.projects.find(p => p.id === projectId);
      if (!originalProject) return;

      // Create new project ID and name
      const newProjectId = `project-${Date.now()}`;
      const newName = `${projectData.projectName || originalProject.name} (Copy)`;

      // Create new project data
      const newProjectData = {
        ...projectData,
        projectName: newName,
        savedAt: new Date().toISOString()
      };

      // Create new project entry for index
      const newProjectEntry = {
        id: newProjectId,
        name: newName,
        updatedAt: new Date().toISOString(),
        slideCount: projectData.slides?.length || 0,
        archived: false
      };

      // Fetch latest clients to avoid race conditions
      let latestClients = await projectStorage.loadClientsIndex();
      if (!latestClients) latestClients = clients;

      // Add to same client
      const updatedClients = latestClients.map(c => {
        if (c.id === clientId) {
          return { ...c, projects: [newProjectEntry, ...c.projects] };
        }
        return c;
      });

      // Save both project and updated index
      await Promise.all([
        projectStorage.saveProject(newProjectId, newProjectData),
        projectStorage.saveClientsIndex(updatedClients)
      ]);

      setClients(updatedClients);
    } catch (e) {
      console.error('Duplicate project error:', e);
      setError('Could not duplicate project');
    }
  };

  // Restore project from trash
  const restoreProject = async (projectId) => {
    try {
      const project = deletedProjects.find(p => p.id === projectId);
      if (!project) return;

      const { clientId, clientName, deletedAt, ...projectData } = project;

      // IMPORTANT: Fetch latest clients from Supabase to avoid overwriting others' projects
      let latestClients = await projectStorage.loadClientsIndex();
      if (!latestClients) latestClients = clients;

      // Find or create the client
      let updatedClients = [...latestClients];
      let existingClient = updatedClients.find(c => c.id === clientId);

      if (existingClient) {
        existingClient.projects = [projectData, ...existingClient.projects];
      } else {
        // Client was deleted, recreate it
        updatedClients.unshift({
          id: clientId,
          name: clientName,
          archived: false,
          createdAt: new Date().toISOString(),
          projects: [projectData]
        });
      }

      setClients(updatedClients);
      await projectStorage.saveClientsIndex(updatedClients);

      // Remove from deleted
      const updatedDeleted = deletedProjects.filter(p => p.id !== projectId);
      setDeletedProjects(updatedDeleted);
      await projectStorage.saveDeletedProjects(updatedDeleted);
    } catch (e) {
      setError('Could not restore project');
    }
  };

  // Permanently delete project
  const permanentlyDeleteProject = async (projectId) => {
    try {
      // Delete project data from storage
      await projectStorage.deleteProject(projectId);

      // Remove from deleted projects
      const updatedDeleted = deletedProjects.filter(p => p.id !== projectId);
      setDeletedProjects(updatedDeleted);
      await projectStorage.saveDeletedProjects(updatedDeleted);
    } catch (e) {
      setError('Could not permanently delete project');
    }
  };

  // Empty project trash
  const emptyProjectTrash = async () => {
    try {
      // Delete all project data
      for (const project of deletedProjects) {
        await projectStorage.deleteProject(project.id);
      }

      setDeletedProjects([]);
      await projectStorage.saveDeletedProjects([]);
    } catch (e) {
      setError('Could not empty trash');
    }
  };

  // Archive/unarchive a project
  const toggleProjectArchive = async (clientId, projectId) => {
    // IMPORTANT: Fetch latest clients from Supabase to avoid overwriting others' projects
    let latestClients = await projectStorage.loadClientsIndex();
    if (!latestClients) latestClients = clients;

    const updatedClients = latestClients.map(client => {
      if (client.id === clientId) {
        return {
          ...client,
          projects: client.projects.map(p =>
            p.id === projectId ? { ...p, archived: !p.archived } : p
          )
        };
      }
      return client;
    });

    setClients(updatedClients);
    // Save to Supabase only
    await projectStorage.saveClientsIndex(updatedClients);
  };

  // Archive/unarchive a client (and all its projects)
  const toggleClientArchive = async (clientId) => {
    // IMPORTANT: Fetch latest clients from Supabase to avoid overwriting others' projects
    let latestClients = await projectStorage.loadClientsIndex();
    if (!latestClients) latestClients = clients;

    const updatedClients = latestClients.map(client => {
      if (client.id === clientId) {
        return { ...client, archived: !client.archived };
      }
      return client;
    });

    setClients(updatedClients);
    // Save to Supabase only
    await projectStorage.saveClientsIndex(updatedClients);
  };

  // Delete a client and all its projects (moves all projects to trash first)
  const deleteClient = async (clientId) => {
    try {
      // IMPORTANT: Fetch latest clients from Supabase to avoid overwriting others' projects
      let latestClients = await projectStorage.loadClientsIndex();
      if (!latestClients) latestClients = clients;

      const client = latestClients.find(c => c.id === clientId);
      if (!client) return;

      // Move ALL projects to trash first (soft delete)
      const projectsToTrash = client.projects.map(project => ({
        ...project,
        clientId,
        clientName: client.name,
        deletedAt: new Date().toISOString()
      }));

      const updatedDeleted = [...projectsToTrash, ...deletedProjects];
      setDeletedProjects(updatedDeleted);

      // Save deleted projects to Supabase only
      await projectStorage.saveDeletedProjects(updatedDeleted);

      // Remove client from clients list
      const updatedClients = latestClients.filter(c => c.id !== clientId);
      setClients(updatedClients);

      // Save to Supabase only
      await projectStorage.saveClientsIndex(updatedClients);

      // If current project was in this client, reset
      if (client.projects.some(p => p.id === currentProjectId)) {
        setSlides([]);
        setProjectName('');
        setClientName('');
        setCurrentProjectId(null);
        setInputCollapsed(false);
      }
    } catch (e) {
      setError('Could not delete client');
    }
  };

  // Export slides to PDF
  const exportToPdf = async () => {
    if (!slides.length) return;

    setIsExporting(true);
    setExportProgress({ current: 0, total: slides.length });

    try {
      // Create PDF in landscape 16:9 aspect ratio
      // Standard 16:9 dimensions: 1920x1080 or scaled down
      const pdfWidth = 297; // A4 landscape width in mm (close to 16:9)
      const pdfHeight = 167; // Adjusted for 16:9 ratio
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      // Create a hidden container for rendering slides
      // KEY INSIGHT: Render at EXACT editor size (900x506) and let html2canvas scale
      // This keeps browser layout identical (same line breaks, same text positioning)
      const CANVAS_W = 900;
      const CANVAS_H = 506;
      const OUTPUT_W = 1920;
      const OUTPUT_H = 1080;
      const captureScale = OUTPUT_W / CANVAS_W; // 2.1333... - for html2canvas only

      // Ensure fonts are fully loaded before capture
      await Promise.all([
        document.fonts.load('400 17px "Inter"'),
        document.fonts.load('600 17px "Inter"'),
        document.fonts.load('400 56px "Bebas Neue"'),
        document.fonts.load('400 13px "JetBrains Mono"'),
      ]);
      await document.fonts.ready;

      // Use position:fixed + left:-10000px (not display:none) so fonts paint
      // CRITICAL: Apply same global CSS styles as the main app for consistent text rendering
      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        left: -10000px;
        top: 0;
        width: ${CANVAS_W}px;
        height: ${CANVAS_H}px;
        pointer-events: none;
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      `;
      document.body.appendChild(container);

      for (let i = 0; i < slides.length; i++) {
        setExportProgress({ current: i + 1, total: slides.length });
        const slide = slides[i];

        container.innerHTML = '';

        // Create slide at EXACT editor size (900x506) - no scaling!
        // Apply same base styles as the editor canvas
        const slideEl = document.createElement('div');
        slideEl.style.cssText = `
          position: relative;
          width: ${CANVAS_W}px;
          height: ${CANVAS_H}px;
          background: ${slide.background?.color || '#000000'};
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        `;

        // Background image at exact editor positioning
        if (slide.background?.image) {
          const bgContainer = document.createElement('div');
          bgContainer.style.cssText = `
            position: absolute;
            left: ${slide.background.x ?? 0}px;
            top: ${slide.background.y ?? 0}px;
            width: ${slide.background.width ?? CANVAS_W}px;
            height: ${slide.background.height ?? CANVAS_H}px;
            opacity: ${slide.background.opacity ?? 1};
            overflow: hidden;
          `;

          const bgImg = document.createElement('img');
          bgImg.src = slide.background.image;
          bgImg.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
          `;
          bgImg.crossOrigin = 'anonymous';
          bgContainer.appendChild(bgImg);
          slideEl.appendChild(bgContainer);
        }

        // Track links (will be scaled for PDF)
        const slideLinks = [];

        // Render elements at EXACT editor values - NO rounding, use exact floats
        for (const element of slide.elements) {
          const el = document.createElement('div');

          // Use EXACT editor values - no rounding! Sub-pixel positioning matters
          const x = element.x;
          const y = element.y;
          const w = element.width;
          const h = element.height;

          const heightStyle = element.type === 'text' ? `min-height: ${h}px;` : `height: ${h}px;`;
          el.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${w}px;
            ${heightStyle}
            box-sizing: border-box;
          `;

          if (element.type === 'text') {
            const textAlign = element.align || 'left';
            const fontFamily = element.fontFamily === 'Bebas Neue' ? "'Bebas Neue', sans-serif" :
                              element.fontFamily === 'JetBrains Mono' ? "'JetBrains Mono', monospace" :
                              "'Inter', sans-serif";

            // Use EXACT fontSize - no rounding!
            const fontSize = element.fontSize;

            // Match editor EXACTLY - same styles as textStyle in ElementRenderer
            const justifyContent = textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start';
            el.style.cssText += `
              display: flex;
              align-items: flex-start;
              justify-content: ${justifyContent};
              color: ${element.color || '#FFFFFF'};
              font-size: ${fontSize}px;
              font-weight: ${element.fontWeight || 'normal'};
              font-style: ${element.fontStyle || 'normal'};
              font-family: ${fontFamily};
              text-align: ${textAlign};
              line-height: 1.2;
            `;

            // Wrap text in span - matches editor's <span style={{ whiteSpace: 'pre-wrap' }}>
            const textSpan = document.createElement('span');
            textSpan.style.cssText = 'white-space: pre-wrap; line-height: inherit;';
            textSpan.innerText = element.content || '';
            el.appendChild(textSpan);

            // Track links (scaled for final PDF output)
            if (element.hyperlink) {
              slideLinks.push({
                x: x * captureScale,
                y: y * captureScale,
                width: w * captureScale,
                height: h * captureScale,
                url: element.hyperlink
              });
            }
            if (element.links && element.links.length > 0) {
              for (const link of element.links) {
                slideLinks.push({
                  x: x * captureScale,
                  y: y * captureScale,
                  width: w * captureScale,
                  height: h * captureScale,
                  url: link.url
                });
              }
            }
          } else if (element.type === 'shape') {
            const borderRadius = element.shapeType === 'ellipse'
              ? '50%'
              : `${element.borderRadius || 0}px`;
            el.style.cssText += `
              background-color: ${element.color || '#FFFFFF'};
              border-radius: ${borderRadius};
            `;
          } else if (element.type === 'image') {
            const img = document.createElement('img');
            img.src = resolveImageSrc(element.src);
            img.crossOrigin = 'anonymous';
            const imgBorderRadius = element.frameStyle === 'rounded' ? '8px' : '0';
            const imgObjectFit = isLogoImage(element.src) ? 'contain' : 'cover';
            img.style.cssText = `
              width: 100%;
              height: 100%;
              object-fit: ${imgObjectFit};
              border-radius: ${imgBorderRadius};
            `;
            el.appendChild(img);
          } else if (element.type === 'video') {
            const videoUrl = element.src || element.videoUrl;
            let thumbnailUrl = element.pdfThumbnail || null;
            let videoLink = videoUrl;

            const youtubeMatch = videoUrl?.match(
              /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
            );
            if (youtubeMatch) {
              if (!thumbnailUrl) {
                thumbnailUrl = `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
              }
              videoLink = `https://www.youtube.com/watch?v=${youtubeMatch[1]}`;
            }

            const vimeoMatch = videoUrl?.match(/vimeo\.com\/(\d+)/);
            if (vimeoMatch) {
              videoLink = `https://vimeo.com/${vimeoMatch[1]}`;
            }

            el.style.cssText += `
              background: #18181B;
              border-radius: 8px;
              overflow: hidden;
              position: relative;
            `;

            if (thumbnailUrl) {
              const thumb = document.createElement('img');
              thumb.src = thumbnailUrl;
              thumb.crossOrigin = 'anonymous';
              thumb.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                position: absolute;
                top: 0;
                left: 0;
              `;
              el.appendChild(thumb);
            }

            const overlay = document.createElement('div');
            overlay.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0,0,0,0.5);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            `;

            const playBtn = document.createElement('div');
            const playSize = Math.min(w, h) * 0.2;
            playBtn.style.cssText = `
              width: ${playSize}px;
              height: ${playSize}px;
              border-radius: 50%;
              background: rgba(255,255,255,0.9);
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 16px;
            `;

            const playTriangle = document.createElement('div');
            const triangleSize = playSize * 0.35;
            playTriangle.style.cssText = `
              width: 0;
              height: 0;
              border-left: ${triangleSize}px solid #000;
              border-top: ${triangleSize * 0.6}px solid transparent;
              border-bottom: ${triangleSize * 0.6}px solid transparent;
              margin-left: ${triangleSize * 0.25}px;
            `;
            playBtn.appendChild(playTriangle);
            overlay.appendChild(playBtn);

            const clickText = document.createElement('div');
            clickText.style.cssText = `
              color: white;
              font-size: 12px;
              font-weight: 600;
              font-family: 'Inter', sans-serif;
              letter-spacing: 0.1em;
              text-transform: uppercase;
            `;
            clickText.innerText = 'CLICK TO PLAY';
            overlay.appendChild(clickText);

            el.appendChild(overlay);

            if (videoLink) {
              slideLinks.push({
                x: x * captureScale,
                y: y * captureScale,
                width: w * captureScale,
                height: h * captureScale,
                url: videoLink
              });
            }
          }

          slideEl.appendChild(el);
        }

        // Corner brackets at exact editor values
        const cornerOffset = 16;
        const lineLength = 20;
        const dotSize = 3;

        const tlCorner = document.createElement('div');
        tlCorner.innerHTML = `
          <div style="position:absolute;top:${cornerOffset}px;left:${cornerOffset}px;">
            <div style="position:absolute;width:${lineLength}px;height:1px;background:rgba(255,255,255,0.1);top:0;left:0;"></div>
            <div style="position:absolute;width:1px;height:${lineLength}px;background:rgba(255,255,255,0.1);top:0;left:0;"></div>
            <div style="position:absolute;width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:rgba(196,30,58,0.4);top:-1px;left:-1px;"></div>
          </div>
        `;
        slideEl.appendChild(tlCorner);

        const trCorner = document.createElement('div');
        trCorner.innerHTML = `
          <div style="position:absolute;top:${cornerOffset}px;right:${cornerOffset}px;">
            <div style="position:absolute;width:${lineLength}px;height:1px;background:rgba(255,255,255,0.1);top:0;right:0;"></div>
            <div style="position:absolute;width:1px;height:${lineLength}px;background:rgba(255,255,255,0.1);top:0;right:0;"></div>
            <div style="position:absolute;width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:rgba(255,255,255,0.2);top:-1px;right:-1px;"></div>
          </div>
        `;
        slideEl.appendChild(trCorner);

        const blCorner = document.createElement('div');
        blCorner.innerHTML = `
          <div style="position:absolute;bottom:${cornerOffset}px;left:${cornerOffset}px;">
            <div style="position:absolute;width:${lineLength}px;height:1px;background:rgba(255,255,255,0.1);bottom:0;left:0;"></div>
            <div style="position:absolute;width:1px;height:${lineLength}px;background:rgba(255,255,255,0.1);bottom:0;left:0;"></div>
          </div>
        `;
        slideEl.appendChild(blCorner);

        const brCorner = document.createElement('div');
        brCorner.innerHTML = `
          <div style="position:absolute;bottom:${cornerOffset}px;right:${cornerOffset}px;">
            <div style="position:absolute;width:${lineLength}px;height:1px;background:rgba(255,255,255,0.1);bottom:0;right:0;"></div>
            <div style="position:absolute;width:1px;height:${lineLength}px;background:rgba(255,255,255,0.1);bottom:0;right:0;"></div>
            <div style="position:absolute;width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:rgba(196,30,58,0.4);bottom:-1px;right:-1px;"></div>
          </div>
        `;
        slideEl.appendChild(brCorner);

        // Contact info on last slide (at 900x506 scale)
        const isLastSlide = i === slides.length - 1;
        const hasContactInfo = contactName || contactEmail || contactPhone;

        if (isLastSlide && hasContactInfo) {
          const contactContainer = document.createElement('div');
          contactContainer.style.cssText = `
            position: absolute;
            bottom: 56px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            font-family: 'Inter', sans-serif;
          `;

          const headerEl = document.createElement('div');
          headerEl.style.cssText = `
            color: #FFFFFF;
            font-size: 22px;
            line-height: 26px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 6px;
            font-family: 'Bebas Neue', sans-serif;
          `;
          headerEl.innerText = "THANK YOU";
          contactContainer.appendChild(headerEl);

          const subtitleEl = document.createElement('div');
          subtitleEl.style.cssText = `
            color: #FFFFFF;
            font-size: 11px;
            line-height: 13px;
            font-weight: 500;
            margin-bottom: 15px;
          `;
          subtitleEl.innerText = "Please reach out to discuss next steps.";
          contactContainer.appendChild(subtitleEl);

          if (contactName) {
            const nameEl = document.createElement('div');
            nameEl.style.cssText = `
              color: #FFFFFF;
              font-size: 15px;
              line-height: 18px;
              font-weight: 600;
              margin-bottom: 8px;
            `;
            nameEl.innerText = contactName;
            contactContainer.appendChild(nameEl);
          }

          const contactDetailsEl = document.createElement('div');
          contactDetailsEl.style.cssText = `
            color: #FFFFFF;
            font-size: 10px;
            line-height: 12px;
          `;

          const parts = [];
          if (contactEmail) parts.push(contactEmail);
          if (contactPhone) parts.push(contactPhone);
          contactDetailsEl.innerText = parts.join('   ·   ');

          if (parts.length > 0) {
            contactContainer.appendChild(contactDetailsEl);
          }

          slideEl.appendChild(contactContainer);
        }

        container.appendChild(slideEl);

        // Wait for images to load
        await new Promise(resolve => setTimeout(resolve, 150));

        // CRITICAL: Let html2canvas scale the capture, not the DOM
        // This preserves exact browser layout (same line breaks)
        const canvas = await html2canvas(slideEl, {
          scale: captureScale,  // Scale output, not DOM
          width: CANVAS_W,
          height: CANVAS_H,
          windowWidth: CANVAS_W,
          windowHeight: CANVAS_H,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#000000',
          logging: false
        });

        // Add to PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) {
          pdf.addPage([pdfWidth, pdfHeight], 'landscape');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        // Add clickable email link on last slide if contact email exists
        if (isLastSlide && contactEmail) {
          // Calculate approximate position of email in PDF coordinates
          // Contact info is at bottom: 120px from bottom in 1080px height
          // Email is roughly at y = 1080 - 120 - 24 (header) - 16 (name margin) - 32 (name) - 16 = ~872px
          // In a 1920x1080 canvas scaled to 297x167mm PDF
          const pdfScaleX = pdfWidth / 1920;
          const pdfScaleY = pdfHeight / 1080;

          // Estimate email position - centered horizontally, near bottom
          const emailY = 1080 - 120 - 24 - 16 - 32 - 8; // ~880px from top
          const emailHeight = 30;
          const emailWidth = contactEmail.length * 14; // Rough estimate of width
          const emailX = (1920 - emailWidth) / 2; // Centered

          // Convert to PDF coordinates
          const linkX = emailX * pdfScaleX;
          const linkY = emailY * pdfScaleY;
          const linkW = emailWidth * pdfScaleX;
          const linkH = emailHeight * pdfScaleY;

          // Add clickable mailto: link
          pdf.link(linkX, linkY, linkW, linkH, { url: `mailto:${contactEmail}` });
        }

        // Add all tracked links from slideLinks array as PDF annotations
        // slideLinks contains video links, text hyperlinks, and inline links
        const pdfScaleX = pdfWidth / 1920;
        const pdfScaleY = pdfHeight / 1080;

        for (const link of slideLinks) {
          pdf.link(
            link.x * pdfScaleX,
            link.y * pdfScaleY,
            link.width * pdfScaleX,
            link.height * pdfScaleY,
            { url: link.url }
          );
        }
      }

      // Clean up
      document.body.removeChild(container);

      // Generate filename: clientName-proposal-date.pdf
      const safeClientName = (clientName || 'client').replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${safeClientName}-proposal-${timestamp}.pdf`;

      // Download PDF
      pdf.save(filename);

      // Also save to Supabase if we have a project ID
      if (currentProjectId) {
        try {
          const pdfBlob = pdf.output('blob');
          const formData = new FormData();
          formData.append('file', pdfBlob, filename);
          formData.append('projectId', currentProjectId);

          await fetch('/api/storage/pdf', {
            method: 'POST',
            body: formData
          });
        } catch (e) {
          console.error('Failed to save PDF to cloud:', e);
          // Don't show error - local download already worked
        }
      }

      setExportProgress({ current: 0, total: 0 });
    } catch (e) {
      console.error('Export failed:', e);
      setError('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle setting proposal expiration - adds expiration text to last slide
  const handleSetExpiration = (days) => {
    setProposalExpirationDays(days);

    if (slides.length === 0) return;

    // Calculate expiration date
    const expirationDate = days
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      : null;

    // Format the date nicely
    const formattedDate = expirationDate
      ? expirationDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : null;

    // Update the last slide
    const lastSlideIndex = slides.length - 1;
    const lastSlide = slides[lastSlideIndex];

    // Look for existing expiration element (by special marker in id)
    const existingExpirationIndex = lastSlide.elements.findIndex(el =>
      el.id?.startsWith('expiration-')
    );

    let updatedElements;

    if (days === null) {
      // Remove expiration if setting to null
      if (existingExpirationIndex >= 0) {
        updatedElements = lastSlide.elements.filter((_, i) => i !== existingExpirationIndex);
      } else {
        return; // Nothing to remove
      }
    } else {
      // Create or update expiration element
      const expirationElement = {
        id: `expiration-${Date.now()}`,
        type: 'text',
        content: `This proposal expires ${formattedDate}`,
        x: 450, // Centered horizontally
        y: 460, // Near bottom (above safe zone)
        width: 400,
        height: 30,
        fontSize: 11,
        fontWeight: 'normal',
        fontFamily: 'JetBrains Mono',
        color: '#6B7280', // Muted gray
        align: 'center'
      };

      if (existingExpirationIndex >= 0) {
        // Update existing
        updatedElements = [...lastSlide.elements];
        updatedElements[existingExpirationIndex] = expirationElement;
      } else {
        // Add new
        updatedElements = [...lastSlide.elements, expirationElement];
      }
    }

    // Update slides
    const updatedSlides = slides.map((slide, i) =>
      i === lastSlideIndex
        ? { ...slide, elements: updatedElements }
        : slide
    );

    updateSlides(updatedSlides);
  };

  // ============================================
// EXPIRATION MODAL
  // BACKGROUND IMAGE GENERATION
  // ============================================
// EXPIRATION MODAL
  const generateBackgroundImages = async (slides, clientName, projectName, projectNotes) => {
    // Storage constants for uploading
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;
    const STORAGE_BUCKET = 'validate-images';
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    };
    const getPublicUrl = (path) => `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;

    // Define a consistent artistic style for all backgrounds
    const artisticStyles = [
      'cinematic photography with heavy film grain, high contrast, moody lighting',
      'gritty documentary style with desaturated colors and natural textures',
      'abstract minimalist composition with geometric shadows and subtle gradients',
      'noir-inspired high contrast black and white with dramatic shadows',
      'fine art photography with muted earth tones and soft vignette'
    ];

    // Pick one style randomly for consistency across all slides
    const chosenStyle = artisticStyles[Math.floor(Math.random() * artisticStyles.length)];

    console.log(`Generating ${slides.length} background images with style: ${chosenStyle}`);

    // Generate backgrounds for each slide in parallel (with concurrency limit)
    const generateForSlide = async (slide, index) => {
      try {
        // Create a prompt based on the slide content and project context
        const slideContent = slide.elements
          ?.filter(el => el.type === 'text')
          .map(el => el.content)
          .join(' ') || slide.name;

        const prompt = `Create a ${chosenStyle} background image for a professional proposal slide.

Context: ${clientName ? `Client: ${clientName}.` : ''} ${projectName ? `Project: ${projectName}.` : ''}
Slide theme: ${slide.name || 'Presentation slide'}
Slide content hints: ${slideContent.slice(0, 200)}

Requirements:
- Abstract or environmental, NOT literal illustrations
- Dark moody atmosphere suitable for white text overlay
- Cinematic 16:9 composition
- Professional premium aesthetic
- Subtle visual interest without distracting from text
- NO people, faces, logos, or text in the image
- Muted color palette with deep blacks and subtle accents
- This is NOT an AI-generated looking image - it should look like authentic photography or fine art`;

        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, aspectRatio: '16:9' })
        });

        const data = await response.json();

        if (!response.ok || !data.image) {
          console.error(`Failed to generate background for slide ${index + 1}:`, data.error);
          return null;
        }

        // Convert base64 to blob and upload to Supabase
        const byteCharacters = atob(data.image.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.image.mimeType });

        // Generate unique filename
        const ext = data.image.mimeType.split('/')[1] || 'png';
        const filename = `bg-${Date.now()}-${index}.${ext}`;

        // Upload to Supabase
        const uploadResponse = await fetch(
          `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filename}`,
          {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': data.image.mimeType
            },
            body: blob
          }
        );

        if (!uploadResponse.ok) {
          console.error(`Failed to upload background for slide ${index + 1}`);
          return null;
        }

        const imageUrl = getPublicUrl(filename);
        console.log(`Generated background for slide ${index + 1}: ${imageUrl}`);

        return {
          slideId: slide.id,
          imageUrl,
          opacity: 0.4 // 40% opacity as requested
        };
      } catch (err) {
        console.error(`Error generating background for slide ${index + 1}:`, err);
        return null;
      }
    };

    // Generate in batches of 2 to avoid overwhelming the API
    const results = [];
    for (let i = 0; i < slides.length; i += 2) {
      const batch = slides.slice(i, i + 2);
      const batchResults = await Promise.all(
        batch.map((slide, batchIndex) => generateForSlide(slide, i + batchIndex))
      );
      results.push(...batchResults);
    }

    // Apply backgrounds to slides
    const updatedSlides = slides.map(slide => {
      const result = results.find(r => r && r.slideId === slide.id);
      if (result) {
        return {
          ...slide,
          background: {
            ...slide.background,
            image: result.imageUrl,
            opacity: result.opacity
          }
        };
      }
      return slide;
    });

    return updatedSlides;
  };

  const handleGenerate = async (rawInput, clientNameInput, projectNameInput, generateBackgrounds = false) => {
    setIsGenerating(true);
    setError(null);
    setMessages([]);

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const userPrompt = `DESIGN a complete VALIDATE proposal with full slide layouts.

You are the Creative Director. Make layout decisions based on the design rules:
- Choose the right archetype for each slide (MONOLITH, SPLIT_WORLD, MAGAZINE_SPREAD, DASHBOARD)
- Position elements with exact x, y, width, height coordinates (canvas: 900x506)
- Apply typography hierarchy (56px hero, 32px titles, 17px body, 11px metadata)
- Use negative space intentionally - don't fill every corner

IMPORTANT: Include EVERY detail from the notes - do not summarize away specifics.
Only create multiple options if explicitly requested.

PROJECT NOTES:
${rawInput}

${clientNameInput ? `CLIENT: ${clientNameInput}` : ''}
${projectNameInput ? `PROJECT: ${projectNameInput}` : ''}
DATE: ${dateStr}

Return complete slide layouts as JSON with { "slides": [...] } format.`;

    let proposalData = null;
    let newSlides = null;

    // Helper function to make API call with retry
    const makeApiCall = async (retries = 2) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // Increased to 3 minutes for layout generation

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 16000, // Increased for full layout generation
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }]
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Handle overload errors with retry
        if (response.status === 529 || response.status === 503) {
          if (retries > 0) {
            await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds
            return makeApiCall(retries - 1);
          }
          throw new Error('API is busy. Please try again in a moment.');
        }
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };
    
    try {
      console.log('Starting API call...');
      const response = await makeApiCall();
      console.log('API response received, status:', response.status);

      const data = await response.json();
      console.log('Response data keys:', Object.keys(data));

      if (data.error) {
        console.error('API returned error:', data.error);
        throw new Error(data.error.message || data.error || 'API returned an error');
      }

      const text = data.content?.[0]?.text || '';
      console.log('Response text length:', text?.length);
      
      if (!text) {
        throw new Error('Empty response from API - no content received');
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response. Text preview:', text.substring(0, 200));
        throw new Error('Could not find JSON in response');
      }

      console.log('Parsing JSON...');
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('Parsed keys:', Object.keys(parsed));
      const format = detectResponseFormat(parsed);
      console.log('Detected format:', format);

      console.log('AI response format:', format);

      if (format === 'layout') {
        // New format: AI-generated layouts
        const validationResults = validateProposal(parsed.slides);
        const summary = getValidationSummary(validationResults);

        if (summary.totalErrors > 0) {
          console.warn('Layout validation errors:', summary.errorDetails);
          // Show validation errors to user
          setValidationWarnings([
            `Layout had ${summary.totalErrors} error(s) - using fallback layout`,
            ...summary.errorDetails.slice(0, 5)
          ]);
          // Fallback: Extract content and use legacy conversion
          console.log('Falling back to proposalToSlides()');
          proposalData = extractContentFromLayout(parsed);
          newSlides = proposalToSlides(proposalData);
        } else {
          // Use AI-generated layouts directly
          console.log('Using AI-generated layouts');
          if (summary.totalWarnings > 0) {
            // Log warnings to console only - don't alarm user with design guideline suggestions
            console.warn('Layout validation warnings (non-critical):', summary.warningDetails);
          }
          proposalData = parsed; // Store original for reference
          newSlides = processLayoutSlides(parsed);
        }
      } else if (format === 'content') {
        // Old format: Content-only (backward compatible)
        console.log('Using legacy content format');
        proposalData = parsed;
        newSlides = proposalToSlides(proposalData);
      } else {
        throw new Error('Unrecognized response format');
      }

      // NOTE: Regular automatic image generation is DISABLED during initial proposal generation.
      // However, if generateBackgrounds is true, we'll generate background images for all slides.

    } catch (err) {
      console.error('Generation error:', err);
      console.error('Error stack:', err.stack);
      const errorMessage = err.name === 'AbortError'
        ? 'Request timed out. Try with shorter notes or try again.'
        : (err.message || 'Failed to generate proposal');
      setError(errorMessage);
      setIsGenerating(false);
      return;
    }

    // If we got here, we have valid slides - update UI immediately
    console.log('Updating UI with new slides...');
    const newProjectId = `project-${Date.now()}`;
    const newName = projectNameInput || clientNameInput || 'New Proposal';

    try {
      setProposal(proposalData);
      setSlides(newSlides);
      setHistory([JSON.stringify(newSlides)]);
      setHistoryIndex(0);
      setCurrentSlideIndex(0);
      setSelectedElementIds([]);
      setInputCollapsed(true);
      setProjectName(newName);
      setClientName(clientNameInput || '');
      setCurrentProjectId(newProjectId);
      setEditingMode('proposal'); // Set editing mode to proposal
      setCurrentCaseStudyId(null); // Clear any case study ID
      setOriginalNotes(rawInput); // Store original notes for AI context
      setIsGenerating(false); // Clear loading state BEFORE storage operations
      console.log('UI updated successfully');
    } catch (uiErr) {
      console.error('UI update error:', uiErr);
      setError('Failed to update UI: ' + uiErr.message);
      setIsGenerating(false);
      return;
    }

    // Generate background images if requested (runs in background after UI is shown)
    if (generateBackgrounds && newSlides.length > 0) {
      generateBackgroundImages(newSlides, clientNameInput, projectNameInput, rawInput).then(updatedSlides => {
        if (updatedSlides) {
          updateSlides(updatedSlides);
        }
      }).catch(err => {
        console.error('Background image generation failed:', err);
      });
    }

    // Save to storage in background - don't block UI
    console.log('Saving to storage...');
    try {
      const newProjectEntry = {
        id: newProjectId,
        name: newName,
        updatedAt: new Date().toISOString(),
        slideCount: newSlides.length,
        archived: false
      };

      // IMPORTANT: Fetch latest clients from Supabase to avoid overwriting others' projects
      let latestClients = await projectStorage.loadClientsIndex();
      console.log('Loaded clients:', latestClients?.length || 0);
      if (!latestClients) latestClients = clients;

      let updatedClients = [...latestClients];
      const existingClient = updatedClients.find(c => c.name.toLowerCase() === clientNameInput?.toLowerCase());
      
      if (existingClient) {
        existingClient.projects = [newProjectEntry, ...existingClient.projects];
      } else if (clientNameInput) {
        updatedClients.unshift({
          id: `client-${Date.now()}`,
          name: clientNameInput,
          archived: false,
          createdAt: new Date().toISOString(),
          projects: [newProjectEntry]
        });
      } else {
        let uncategorized = updatedClients.find(c => c.name === 'Uncategorized');
        if (!uncategorized) {
          uncategorized = {
            id: 'client-uncategorized',
            name: 'Uncategorized',
            archived: false,
            createdAt: new Date().toISOString(),
            projects: []
          };
          updatedClients.push(uncategorized);
        }
        uncategorized.projects = [newProjectEntry, ...uncategorized.projects];
      }
      
      setClients(updatedClients);

      const projectData = {
        slides: newSlides,
        projectName: newName,
        clientName: clientNameInput || '',
        originalNotes: rawInput,
        savedAt: new Date().toISOString()
      };

      // Save to Supabase only
      const [clientsSaved, projectSaved] = await Promise.all([
        projectStorage.saveClientsIndex(updatedClients),
        projectStorage.saveProject(newProjectId, projectData)
      ]);
      console.log('Storage save results - clients:', clientsSaved, 'project:', projectSaved);
    } catch (storageErr) {
      console.error('Storage error (non-blocking):', storageErr);
      // Don't show error to user - the proposal is still visible
    }
    console.log('handleGenerate complete');
  };

  // ============================================
// EXPIRATION MODAL
  // CASE STUDY GENERATION
  // ============================================
// EXPIRATION MODAL
  const handleGenerateCaseStudy = async (rawInput, clientNameInput, projectNameInput, generateBackgrounds = false) => {
    setIsGenerating(true);
    setError(null);
    setMessages([]);

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const userPrompt = `Generate a CASE STUDY presentation with exactly 4 slides.

You are the Creative Director. Create a case study showcasing completed work.

CASE STUDY DETAILS:
${rawInput}

${clientNameInput ? `CLIENT: ${clientNameInput}` : ''}
${projectNameInput ? `PROJECT: ${projectNameInput}` : ''}
DATE: ${dateStr}

Generate exactly 4 slides:
1. Cover - Client name, project title, "CASE STUDY" label
2. The Challenge - Problem/opportunity description
3. The Solution - What was delivered, approach taken
4. The Results - Outcomes, metrics, impact

Return complete slide layouts as JSON with { "slides": [...] } format.`;

    let newSlides = null;

    const makeApiCall = async (retries = 2) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 16000,
            system: CASE_STUDY_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: userPrompt }]
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.status === 529 || response.status === 503) {
          if (retries > 0) {
            await new Promise(r => setTimeout(r, 2000));
            return makeApiCall(retries - 1);
          }
          throw new Error('API is busy. Please try again in a moment.');
        }

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        return response;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    try {
      const response = await makeApiCall();
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'API returned an error');
      }

      const text = data.content?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not find JSON in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed.slides && Array.isArray(parsed.slides)) {
        newSlides = processLayoutSlides(parsed);
      } else {
        throw new Error('Invalid case study format');
      }

    } catch (err) {
      console.error('Case study generation error:', err);
      const errorMessage = err.name === 'AbortError'
        ? 'Request timed out. Try with shorter notes or try again.'
        : (err.message || 'Failed to generate case study');
      setError(errorMessage);
      setIsGenerating(false);
      return;
    }

    // Create case study entry
    const caseStudyId = `cs-${Date.now()}`;
    const caseStudyName = projectNameInput || clientNameInput || 'New Case Study';

    // If generateBackgrounds is true, generate background images for all slides
    if (generateBackgrounds && newSlides.length > 0) {
      try {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Generating background images for your case study...' }]);
        newSlides = await generateBackgroundImages(newSlides, clientNameInput, projectNameInput, rawInput);
      } catch (bgError) {
        console.error('Background image generation failed (non-blocking):', bgError);
        // Continue without background images
      }
    }

    // IMPORTANT: Clear project ID BEFORE setting slides to prevent autosave race condition
    // The autosave uses refs, so we also immediately update the ref
    setCurrentProjectId(null);
    currentProjectIdRef.current = null; // Immediately update ref to prevent autosave saving to wrong project

    setSlides(newSlides);
    setHistory([JSON.stringify(newSlides)]);
    setHistoryIndex(0);
    setCurrentSlideIndex(0);
    setSelectedElementIds([]);
    setInputCollapsed(true);
    setProjectName(caseStudyName);
    setClientName(clientNameInput || '');
    setEditingMode('caseStudy');
    setCurrentCaseStudyId(caseStudyId);
    setIsGenerating(false);

    // Save to case studies library
    try {
      const caseStudyEntry = {
        id: caseStudyId,
        name: caseStudyName,
        clientName: clientNameInput || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slideCount: newSlides.length
      };

      const caseStudyData = {
        id: caseStudyId,
        name: caseStudyName,
        clientName: clientNameInput || '',
        slides: newSlides,
        savedAt: new Date().toISOString()
      };

      // Load existing case studies index
      let existingIndex = [];
      try {
        const indexResponse = await fetch('/api/storage?path=case-studies/index.json');
        if (indexResponse.ok) {
          existingIndex = await indexResponse.json();
          if (!Array.isArray(existingIndex)) existingIndex = [];
        }
      } catch (e) {
        console.log('No existing case studies index');
      }

      // Add new case study to index
      const updatedIndex = [caseStudyEntry, ...existingIndex];
      setCaseStudies(updatedIndex);

      // Save both index and case study data
      await Promise.all([
        fetch('/api/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'case-studies/index.json', data: updatedIndex })
        }),
        fetch('/api/storage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: `case-studies/${caseStudyId}.json`, data: caseStudyData })
        })
      ]);

    } catch (storageErr) {
      console.error('Case study storage error (non-blocking):', storageErr);
    }
  };

  // Insert a case study into the current proposal
  const insertCaseStudy = async (caseStudyId) => {
    try {
      // Load the case study data
      const response = await fetch(`/api/storage?path=${encodeURIComponent(`case-studies/${caseStudyId}.json`)}`);
      if (!response.ok) {
        console.error('Failed to load case study');
        return;
      }
      const caseStudy = await response.json();

      if (!caseStudy || !caseStudy.slides || caseStudy.slides.length === 0) {
        console.error('Invalid case study data');
        return;
      }

      // Use ref to get current slides (avoid stale closure)
      const currentSlides = slidesRef.current;

      // Insert at the end of the proposal
      const insertIndex = currentSlides.length;

      // Clone case study slides with new IDs to avoid conflicts
      // Mark them as case study slides so we can show a divider in the viewer
      const clonedSlides = caseStudy.slides.map((slide, idx) => ({
        ...slide,
        id: `cs-insert-${Date.now()}-${idx}`,
        isCaseStudy: true,
        caseStudyName: caseStudy.name || 'Case Study',
        caseStudyIndex: idx, // 0 = first slide of this case study
        elements: slide.elements.map((el, elIdx) => ({
          ...el,
          id: `cs-el-${Date.now()}-${idx}-${elIdx}`
        }))
      }));

      // Insert slides - use currentSlides from ref
      const newSlides = [
        ...currentSlides.slice(0, insertIndex),
        ...clonedSlides,
        ...currentSlides.slice(insertIndex)
      ];

      updateSlides(newSlides);
      setCurrentSlideIndex(insertIndex); // Select first inserted slide
      setShowCaseStudyLibrary(false);

    } catch (err) {
      console.error('Error inserting case study:', err);
    }
  };

  // Delete a case study from the library
  const deleteCaseStudy = async (caseStudyId) => {
    try {
      // Remove from index
      const updatedCaseStudies = caseStudies.filter(cs => cs.id !== caseStudyId);
      setCaseStudies(updatedCaseStudies);

      // Update index in storage
      await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'case-studies/index.json', data: updatedCaseStudies })
      });

      // Delete the case study file
      await fetch('/api/storage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `case-studies/${caseStudyId}.json` })
      });

    } catch (err) {
      console.error('Error deleting case study:', err);
    }
  };

  // Duplicate a case study
  const duplicateCaseStudy = async (caseStudyId) => {
    try {
      // Load the case study data
      const response = await fetch(`/api/storage?path=${encodeURIComponent(`case-studies/${caseStudyId}.json`)}`);
      if (!response.ok) {
        console.error('Failed to load case study for duplication');
        return;
      }
      const caseStudyData = await response.json();

      // Find original entry
      const original = caseStudies.find(cs => cs.id === caseStudyId);
      if (!original) return;

      // Create new case study
      const newId = `cs-${Date.now()}`;
      const newName = `${caseStudyData.name || original.name} (Copy)`;

      // Create new data with new slide IDs
      const newSlides = (caseStudyData.slides || []).map(slide => ({
        ...slide,
        id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      }));

      const newCaseStudyData = {
        ...caseStudyData,
        id: newId,
        name: newName,
        slides: newSlides,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save case study file
      await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `case-studies/${newId}.json`, data: newCaseStudyData })
      });

      // Update index
      const newEntry = {
        id: newId,
        name: newName,
        clientName: original.clientName || '',
        slideCount: newSlides.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedCaseStudies = [newEntry, ...caseStudies];
      setCaseStudies(updatedCaseStudies);

      await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'case-studies/index.json', data: updatedCaseStudies })
      });

    } catch (err) {
      console.error('Error duplicating case study:', err);
    }
  };

  // Load a case study for editing
  const loadCaseStudyForEditing = async (caseStudyId) => {
    try {
      const response = await fetch(`/api/storage?path=${encodeURIComponent(`case-studies/${caseStudyId}.json`)}`);
      if (!response.ok) {
        console.error('Failed to load case study for editing');
        return;
      }
      const caseStudy = await response.json();

      if (!caseStudy || !caseStudy.slides) {
        console.error('Invalid case study data');
        return;
      }

      // Set up for editing
      setSlides(caseStudy.slides);
      setClientName(caseStudy.clientName || '');
      setProjectName(caseStudy.name || 'Untitled Case Study');
      setEditingMode('caseStudy');
      setCurrentCaseStudyId(caseStudyId);
      setCurrentSlideIndex(0);
      setSelectedElementIds([]);
      setHistory([JSON.stringify(caseStudy.slides)]);
      setHistoryIndex(0);
      setInputCollapsed(true);

    } catch (err) {
      console.error('Error loading case study for editing:', err);
    }
  };

  const handleRefine = async (message) => {
    if (!slides.length || isRefining) return;
    
    setIsRefining(true);
    const newUserMessage = { role: 'user', content: message, id: Date.now() };
    setMessages(prev => [...prev, newUserMessage]);
    
    // Failsafe: always clear loading after 5 minutes no matter what
    const failsafeTimeout = setTimeout(() => {
      console.log('Failsafe timeout triggered');
      setIsRefining(false);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Request timed out. Try a smaller request.', id: Date.now() }]);
    }, 300000);

    // Detect if this is an "add slides" request vs "modify existing"
    const lowerMsg = message.toLowerCase();
    const isAddRequest = lowerMsg.includes('add') || lowerMsg.includes('create') || lowerMsg.includes('new slide') ||
                         lowerMsg.includes('insert') || lowerMsg.includes('research') || lowerMsg.includes('generate');
    const isDeleteRequest = lowerMsg.includes('delete') || lowerMsg.includes('remove slide');

    // Detect complex rewrite requests that need two-phase processing
    const isComplexRewrite = (
      (lowerMsg.includes('rewrite') || lowerMsg.includes('redo') || lowerMsg.includes('remake')) &&
      (lowerMsg.includes('entire') || lowerMsg.includes('whole') || lowerMsg.includes('all') ||
       lowerMsg.includes('proposal') || lowerMsg.includes('everything'))
    ) || (
      lowerMsg.includes('act as') || lowerMsg.includes('pretend') || lowerMsg.includes('like a')
    ) || (
      lowerMsg.includes('improve') && (lowerMsg.includes('all') || lowerMsg.includes('every') || lowerMsg.includes('entire'))
    );

    // Detect visual review requests - user wants AI to SEE the slides
    const isVisualReview = (
      (lowerMsg.includes('look at') || lowerMsg.includes('see the') || lowerMsg.includes('screenshot') ||
       lowerMsg.includes('visually') || lowerMsg.includes('visual review') || lowerMsg.includes('review the design'))
    ) && (
      lowerMsg.includes('slide') || lowerMsg.includes('design') || lowerMsg.includes('layout') ||
      lowerMsg.includes('proposal') || lowerMsg.includes('them')
    );

    // ============================================
// EXPIRATION MODAL
    // VISUAL DESIGN REVIEW - AI SEES THE SLIDES
    // ============================================
// EXPIRATION MODAL
    // Captures slides as images and sends to Claude vision for analysis

    if (isVisualReview) {
      try {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '👁️ **Visual Review Mode**\n\nCapturing slides for visual analysis...',
          id: Date.now()
        }]);

        // We need to render slides off-screen to capture them
        // Create a hidden container for rendering
        const container = document.createElement('div');
        container.style.cssText = `
          position: fixed;
          left: -9999px;
          top: 0;
          width: 1920px;
          height: 1080px;
          background: #000;
          overflow: hidden;
        `;
        document.body.appendChild(container);

        const slideImages = [];
        const currentSlides = slidesRef.current;

        for (let i = 0; i < Math.min(currentSlides.length, 10); i++) { // Limit to 10 slides for API limits
          const slide = currentSlides[i];

          // Create slide element
          const slideEl = document.createElement('div');
          slideEl.style.cssText = `
            width: 1920px;
            height: 1080px;
            background: ${slide.background?.color || '#000000'};
            position: relative;
            font-family: 'Inter', sans-serif;
          `;

          // Add background image if exists
          if (slide.background?.image) {
            const bgImg = document.createElement('img');
            bgImg.src = slide.background.image;
            bgImg.style.cssText = `
              position: absolute;
              left: ${(slide.background.x || 0) * 2}px;
              top: ${(slide.background.y || 0) * 2}px;
              width: ${(slide.background.width || 900) * 2}px;
              height: ${(slide.background.height || 506) * 2}px;
              object-fit: cover;
              opacity: ${slide.background.opacity ?? 1};
            `;
            slideEl.appendChild(bgImg);
          }

          // Render elements
          for (const el of slide.elements) {
            if (el.type === 'text') {
              const textEl = document.createElement('div');
              textEl.style.cssText = `
                position: absolute;
                left: ${el.x * 2}px;
                top: ${el.y * 2}px;
                width: ${el.width * 2}px;
                height: ${el.height * 2}px;
                font-size: ${(el.fontSize || 16) * 2}px;
                font-family: ${el.fontFamily || 'Inter'}, sans-serif;
                font-weight: ${el.fontWeight || 'normal'};
                color: ${el.color || '#FFFFFF'};
                text-align: ${el.align || 'left'};
                line-height: 1.3;
                overflow: hidden;
              `;
              textEl.innerText = el.content || '';
              slideEl.appendChild(textEl);
            } else if (el.type === 'image' && el.src) {
              const imgEl = document.createElement('img');
              imgEl.src = el.src;
              imgEl.style.cssText = `
                position: absolute;
                left: ${el.x * 2}px;
                top: ${el.y * 2}px;
                width: ${el.width * 2}px;
                height: ${el.height * 2}px;
                object-fit: cover;
                border-radius: ${el.frameStyle === 'rounded' ? '16px' : '0'};
              `;
              slideEl.appendChild(imgEl);
            } else if (el.type === 'shape') {
              const shapeEl = document.createElement('div');
              shapeEl.style.cssText = `
                position: absolute;
                left: ${el.x * 2}px;
                top: ${el.y * 2}px;
                width: ${el.width * 2}px;
                height: ${el.height * 2}px;
                background: ${el.color || '#C41E3A'};
                border-radius: ${el.shapeType === 'ellipse' ? '50%' : (el.borderRadius || 0) * 2 + 'px'};
              `;
              slideEl.appendChild(shapeEl);
            }
          }

          container.innerHTML = '';
          container.appendChild(slideEl);

          // Wait for images to load
          await new Promise(resolve => setTimeout(resolve, 200));

          // Capture to canvas
          try {
            const canvas = await html2canvas(slideEl, {
              width: 1920,
              height: 1080,
              scale: 0.5, // Reduce size for API
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#000000',
              logging: false
            });

            // Convert to base64 (JPEG for smaller size)
            const imgData = canvas.toDataURL('image/jpeg', 0.7);
            slideImages.push({
              slideIndex: i,
              slideName: slide.name,
              base64: imgData.split(',')[1] // Remove data:image/jpeg;base64, prefix
            });
          } catch (captureErr) {
            console.error(`Failed to capture slide ${i}:`, captureErr);
          }
        }

        // Clean up
        document.body.removeChild(container);

        if (slideImages.length === 0) {
          throw new Error('Could not capture any slides');
        }

        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = {
            ...newMsgs[newMsgs.length - 1],
            content: `👁️ **Visual Review Mode**\n\nCaptured ${slideImages.length} slides. Analyzing design...`
          };
          return newMsgs;
        });

        // Build message with images for Claude
        const imageContents = slideImages.map(img => ({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: img.base64
          }
        }));

        const textContent = {
          type: 'text',
          text: `You are a visual design expert reviewing these ${slideImages.length} presentation slides.

USER'S REQUEST: "${message}"

SLIDE ORDER:
${slideImages.map((img, i) => `Image ${i + 1}: "${img.slideName}"`).join('\n')}

Analyze each slide VISUALLY and provide specific design feedback. Look at:
- Layout balance and composition
- Typography hierarchy (are sizes differentiated enough?)
- Spacing and breathing room
- Visual weight distribution
- Color usage and contrast
- Element alignment
- Overall professional polish

Then provide a JSON response with specific fixes:
{
  "analysis": "Overall visual assessment...",
  "slideIssues": [
    {
      "slideIndex": 0,
      "slideName": "Cover",
      "issues": ["Headline too close to edge", "Needs more negative space on right"],
      "fixes": [
        { "elementIndex": 0, "property": "x", "oldValue": 30, "newValue": 60 },
        { "elementIndex": 0, "property": "width", "newValue": 700 }
      ]
    }
  ],
  "message": "Summary of improvements made"
}

Be specific about pixel values. The canvas is 900x506 pixels.`
        };

        const visionPayload = JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: [...imageContents, textContent]
          }]
        });

        const visionResponse = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'gzip',
            'X-Original-Content-Type': 'application/json'
          },
          body: pako.gzip(visionPayload),
          signal: AbortSignal.timeout(180000)
        });

        if (!visionResponse.ok) {
          throw new Error('Visual analysis failed');
        }

        const visionData = await visionResponse.json();
        const analysisText = visionData.content?.[0]?.text || '';

        // Try to parse JSON response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const analysis = JSON.parse(jsonMatch[0]);

            // Apply fixes
            if (analysis.slideIssues && Array.isArray(analysis.slideIssues)) {
              const updatedSlides = [...slidesRef.current];

              for (const issue of analysis.slideIssues) {
                const slideIdx = issue.slideIndex;
                if (slideIdx >= 0 && slideIdx < updatedSlides.length && issue.fixes) {
                  for (const fix of issue.fixes) {
                    const elIdx = fix.elementIndex;
                    if (elIdx >= 0 && elIdx < updatedSlides[slideIdx].elements.length) {
                      if (fix.property && fix.newValue !== undefined) {
                        updatedSlides[slideIdx].elements[elIdx] = {
                          ...updatedSlides[slideIdx].elements[elIdx],
                          [fix.property]: fix.newValue
                        };
                      }
                    }
                  }
                }
              }

              updateSlides(updatedSlides);

              const issuesSummary = analysis.slideIssues
                .map(s => `**${s.slideName}:** ${s.issues?.join(', ') || 'Minor adjustments'}`)
                .join('\n');

              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `👁️ **Visual Analysis Complete**\n\n${analysis.analysis || ''}\n\n**Issues Found & Fixed:**\n${issuesSummary}\n\n${analysis.message || 'Design improvements applied.'}`,
                id: Date.now()
              }]);
            } else {
              // No structured fixes, just show analysis
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `👁️ **Visual Analysis:**\n\n${analysis.analysis || analysis.message || analysisText}`,
                id: Date.now()
              }]);
            }
          } catch (parseErr) {
            // Show raw analysis if JSON parse fails
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `👁️ **Visual Analysis:**\n\n${analysisText}`,
              id: Date.now()
            }]);
          }
        } else {
          // No JSON found, show raw response
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `👁️ **Visual Analysis:**\n\n${analysisText}`,
            id: Date.now()
          }]);
        }

        clearTimeout(failsafeTimeout);
        setIsRefining(false);
        return;

      } catch (err) {
        console.error('Visual review error:', err);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Visual review failed: ${err.message}\n\nTry a specific request like "improve the layout of slide 1" instead.`,
          id: Date.now()
        }]);
        clearTimeout(failsafeTimeout);
        setIsRefining(false);
        return;
      }
    }

    // ============================================
// EXPIRATION MODAL
    // TWO-PHASE REWRITE FOR COMPLEX REQUESTS
    // ============================================
// EXPIRATION MODAL
    // Phase 1: AI creates a creative strategy (text only - reliable)
    // Phase 2: AI applies strategy to slides in chunks (with strategy as context)

    if (isComplexRewrite) {
      try {
        // Show initial message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '🎬 Starting comprehensive rewrite...\n\n**Phase 1:** Analyzing proposal and crafting creative strategy...',
          id: Date.now()
        }]);

        // Extract all text content for context
        const allContent = slides.map((slide, idx) => {
          const texts = slide.elements
            .filter(el => el.type === 'text' && el.content)
            .map(el => el.content)
            .join('\n');
          return `SLIDE ${idx + 1} (${slide.name}):\n${texts}`;
        }).join('\n\n');

        // Extract key details that MUST be preserved
        const numbers = [];
        const dates = [];
        slides.forEach(slide => {
          slide.elements.forEach(el => {
            if (el.type === 'text' && el.content) {
              // Find all dollar amounts
              const dollarMatches = el.content.match(/\$[\d,]+(?:\.\d{2})?/g);
              if (dollarMatches) numbers.push(...dollarMatches);
              // Find dates
              const dateMatches = el.content.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/gi);
              if (dateMatches) dates.push(...dateMatches);
            }
          });
        });

        // PHASE 1: Get creative strategy
        const phase1Prompt = `You are an expert film director and creative strategist reviewing a video production proposal.

USER'S REQUEST: "${message}"

CURRENT PROPOSAL CONTENT:
${allContent}

CRITICAL DETAILS TO PRESERVE (do not change these):
- Budget/Investment amounts: ${[...new Set(numbers)].join(', ') || 'None found'}
- Dates: ${[...new Set(dates)].join(', ') || 'None found'}
${originalNotes ? `\nORIGINAL PROJECT NOTES:\n${originalNotes}` : ''}

YOUR TASK:
Create a detailed creative rewrite strategy. Do NOT output JSON or slide code.
Just write a clear plan in this format:

CREATIVE VISION:
[2-3 sentences describing the new tone, approach, and emotional arc]

NARRATIVE STRATEGY:
[How the slides should flow as a cohesive story]

SLIDE-BY-SLIDE DIRECTION:
${slides.map((s, i) => `Slide ${i + 1} (${s.name}): [What to change, new headline ideas, tone adjustments]`).join('\n')}

PRESERVED ELEMENTS:
[List the specific numbers, dates, and key details that must stay exactly the same]

Write this strategy now. Be specific and creative.`;

        const phase1Payload = JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: 'You are an expert creative director for VALIDATE, a premium video production company. You craft compelling proposal narratives. Output ONLY the strategy text, no JSON.',
          messages: [{ role: 'user', content: phase1Prompt }]
        });

        const phase1Response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'gzip',
            'X-Original-Content-Type': 'application/json'
          },
          body: pako.gzip(phase1Payload),
          signal: AbortSignal.timeout(120000)
        });

        if (!phase1Response.ok) throw new Error('Strategy generation failed');
        const phase1Data = await phase1Response.json();
        const creativeStrategy = phase1Data.content?.[0]?.text || '';

        if (!creativeStrategy || creativeStrategy.length < 100) {
          throw new Error('Could not generate creative strategy');
        }

        // Show the strategy to user
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `**Phase 1 Complete** ✓\n\n${creativeStrategy.substring(0, 500)}...\n\n**Phase 2:** Applying strategy to slides...`,
          id: Date.now()
        }]);

        // PHASE 2: Apply strategy to slides in chunks
        const chunkSize = 3;
        const updatedSlides = [...slidesRef.current];

        for (let i = 0; i < slides.length; i += chunkSize) {
          const chunkEnd = Math.min(i + chunkSize, slides.length);
          const chunkSlides = slides.slice(i, chunkEnd);

          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = {
              ...newMsgs[newMsgs.length - 1],
              content: `**Phase 2:** Rewriting slides ${i + 1}-${chunkEnd} of ${slides.length}...`
            };
            return newMsgs;
          });

          const phase2Prompt = `Apply this creative strategy to the following slides.

CREATIVE STRATEGY:
${creativeStrategy}

SLIDES TO REWRITE (slides ${i + 1}-${chunkEnd}):
${JSON.stringify(chunkSlides.map(s => ({
  name: s.name,
  background: { ...s.background, image: s.background?.image ? '[BG_IMAGE]' : undefined },
  elements: s.elements.map(({ id, src, videoUrl, videoSrc, ...rest }) => ({
    ...rest,
    ...(src ? { src: '[IMG]' } : {}),
    ...(videoUrl ? { videoUrl: '[VID]' } : {}),
    ...(videoSrc ? { videoSrc: '[VID]' } : {})
  }))
})), null, 2)}

RULES:
1. Keep ALL dollar amounts, dates, and numbers EXACTLY as they are
2. Keep image/video placeholders as [IMG], [VID], [BG_IMAGE]
3. Apply the creative vision to headlines and body text
4. Maintain the same element structure (positions, sizes can adjust slightly)
5. Return ONLY the modified slides array as valid JSON

Return a JSON array with the ${chunkEnd - i} modified slides:`;

          const phase2Payload = JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            system: `${BRAND_GUIDELINES_SHORT}\n\n${DESIGN_RULES_SHORT}\n\nYou are applying a creative rewrite strategy. Return ONLY valid JSON array of slides.`,
            messages: [{ role: 'user', content: phase2Prompt }]
          });

          const phase2Response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Encoding': 'gzip',
              'X-Original-Content-Type': 'application/json'
            },
            body: pako.gzip(phase2Payload),
            signal: AbortSignal.timeout(120000)
          });

          if (!phase2Response.ok) {
            console.error(`Chunk ${i}-${chunkEnd} failed, keeping original`);
            continue;
          }

          const phase2Data = await phase2Response.json();
          const chunkText = phase2Data.content?.[0]?.text || '';

          // Extract JSON array from response
          const arrayMatch = chunkText.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            try {
              const parsedChunk = JSON.parse(arrayMatch[0]);

              // Restore image/video sources from originals
              parsedChunk.forEach((newSlide, chunkIdx) => {
                const originalSlide = slides[i + chunkIdx];
                const globalIdx = i + chunkIdx;

                // Restore background image
                if (newSlide.background?.image === '[BG_IMAGE]' && originalSlide.background?.image) {
                  newSlide.background.image = originalSlide.background.image;
                }

                // Restore element sources
                newSlide.elements = (newSlide.elements || []).map((el, elIdx) => {
                  const origEl = originalSlide.elements[elIdx] || originalSlide.elements.find(o => o.type === el.type);
                  return {
                    ...el,
                    id: el.id || generateElementId(),
                    ...(el.src === '[IMG]' && origEl?.src ? { src: origEl.src } : {}),
                    ...(el.videoUrl === '[VID]' && origEl?.videoUrl ? { videoUrl: origEl.videoUrl } : {}),
                    ...(el.videoSrc === '[VID]' && origEl?.videoSrc ? { videoSrc: origEl.videoSrc } : {})
                  };
                });

                // Update the slide
                updatedSlides[globalIdx] = {
                  ...originalSlide,
                  ...newSlide,
                  id: originalSlide.id,
                  background: { ...originalSlide.background, ...newSlide.background }
                };
              });
            } catch (parseErr) {
              console.error(`JSON parse failed for chunk ${i}-${chunkEnd}:`, parseErr.message);
              // Keep original slides for this chunk
            }
          }
        }

        // Apply all updates
        updateSlides(updatedSlides);

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ **Rewrite complete!**\n\nApplied the creative vision across all ${slides.length} slides. Review the changes and let me know if you'd like any adjustments.`,
          id: Date.now()
        }]);

        clearTimeout(failsafeTimeout);
        setIsRefining(false);
        return; // Exit early - we handled the complex rewrite

      } catch (err) {
        console.error('Two-phase rewrite error:', err);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `The comprehensive rewrite encountered an issue: ${err.message}\n\nTry breaking your request into smaller pieces, like "Improve the cover slide" or "Rewrite the objective section."`,
          id: Date.now()
        }]);
        clearTimeout(failsafeTimeout);
        setIsRefining(false);
        return;
      }
    }

    // ============================================
// EXPIRATION MODAL
    // STANDARD SINGLE-PHASE PROCESSING (for simpler requests)
    // ============================================
// EXPIRATION MODAL

    // Build slide context - include key proposal details so AI knows what the proposal is about
    const extractProposalContext = () => {
      let clientName = '';
      let projectName = '';
      let budget = '';

      // Extract key info from slides
      slides.forEach(slide => {
        slide.elements.forEach(el => {
          if (el.type === 'text' && el.content) {
            const content = el.content;
            // Look for client name (usually small text at top)
            if (el.fontSize <= 13 && el.y < 100 && !clientName) {
              clientName = content;
            }
            // Look for project name (usually large headline)
            if (el.fontSize >= 32 && slide.name.toLowerCase().includes('cover')) {
              projectName = content;
            }
            // Look for budget (contains $)
            if (content.includes('$') && !budget) {
              budget = content;
            }
          }
        });
      });

      return { clientName, projectName, budget };
    };

    const proposalInfo = extractProposalContext();
    const proposalSummary = `
=== THIS PROPOSAL ===
Client: ${proposalInfo.clientName || 'Unknown'}
Project: ${proposalInfo.projectName || 'Unknown'}
Budget: ${proposalInfo.budget || 'Not specified'}
Slides: ${slides.map(s => s.name).join(', ')}
${originalNotes ? `
=== ORIGINAL PROJECT NOTES ===
${originalNotes}
` : ''}
DO NOT change the client, project, or budget. Only make the specific changes requested.
`;

    let slideContext;
    if (isAddRequest && !isDeleteRequest) {
      slideContext = `${proposalSummary}\nCurrent presentation has ${slides.length} slides.`;
    } else {
      // Strip large data (base64 images, long URLs) to reduce payload size
      // but keep full structure for AI context
      const contextJson = JSON.stringify(slides.map(slide => ({
        name: slide.name,
        background: {
          ...slide.background,
          // Replace long image URLs with placeholder
          image: slide.background?.image
            ? (slide.background.image.length > 100 ? '[BG_IMAGE]' : slide.background.image)
            : undefined
        },
        elements: slide.elements.map(({ id, src, videoUrl, ...rest }) => ({
          ...rest,
          // Replace image/video sources with placeholders if they're long
          ...(src ? { src: src.length > 100 ? '[IMG]' : src } : {}),
          ...(videoUrl ? { videoUrl: videoUrl.length > 100 ? '[VID]' : videoUrl } : {})
        }))
      })));
      slideContext = `${proposalSummary}\nCurrent slides JSON:\n${contextJson}`;
    }

    // Build conversation history for API (last 6 messages for context, to save tokens)
    const recentMessages = messages.slice(-6);
    const apiMessages = [];

    // ALWAYS include full slide context with every request to prevent hallucination
    // The AI needs the actual slide data to make accurate modifications

    // Include brief conversation history (just the text, not full slide data)
    if (recentMessages.length > 0) {
      recentMessages.forEach(msg => {
        apiMessages.push({
          role: msg.role,
          content: msg.content.length > 500
            ? msg.content.substring(0, 500) + '...[truncated]'
            : msg.content
        });
      });
    }

    // ALWAYS include current slide JSON with the new message
    // This prevents the AI from "forgetting" the proposal on subsequent messages
    apiMessages.push({
      role: 'user',
      content: `${slideContext}\n\n=== USER REQUEST ===\n${message}\n\n=== IMPORTANT ===\nModify ONLY what was requested. Return the slides with all other content UNCHANGED.`
    });
    
    // Build image library context for AI - only include names to save payload size
    const libraryContext = libraryImages.length > 0
      ? `\n\nIMAGE LIBRARY (${libraryImages.length} images available):
You have access to the user's image library. Available image names:
${libraryImages.slice(0, 20).map(img => `- "${img.name}"`).join('\n')}
${libraryImages.length > 20 ? `\n...and ${libraryImages.length - 20} more images` : ''}

To USE a library image, include a "libraryImages" array in your response:
{
  "libraryImages": [
    {
      "slideIndex": 0,
      "imageName": "exact image name from library",
      "x": 100, "y": 100, "width": 400, "height": 300,
      "asBackground": false
    }
  ]
}

The system will automatically look up the URL by image name. PREFER library images when they match!`
      : '';

    const imageGenInstructions = `

AI IMAGE GENERATION:
You can request AI-generated images! Include an "images" array in your response:
{
  "images": [
    {
      "slideIndex": 0,
      "prompt": "Detailed prompt for the image - be specific about subject, style, mood, colors",
      "x": 100, "y": 100, "width": 400, "height": 300,
      "asBackground": false
    }
  ]
}

Generate images when the user asks for:
- Images, photos, visuals, graphics
- Specific scenes or concepts to visualize
- Background images for slides
- Any visual content

Be creative with prompts. For VALIDATE brand, prefer dark, cinematic, moody visuals.
${libraryContext}`;

    const systemPrompt = isAddRequest && !isDeleteRequest
      ? `${BRAND_GUIDELINES_SHORT}

${DESIGN_RULES_SHORT}

You are a presentation assistant for VALIDATE helping refine an EXISTING proposal.

=== ABOUT THIS SYSTEM ===
You are powered by Claude Opus 4.5 API from Anthropic. Image generation uses Gemini 3 Pro Image Preview from Google.
If asked what API or model you are using, answer: "I'm powered by Claude Opus 4.5 for text/proposals, and Gemini 3 Pro Image Preview for image generation."

=== ABSOLUTE RULES - VIOLATION IS FAILURE ===

*** DO NOT CHANGE ANY TEXT CONTENT UNLESS EXPLICITLY ASKED ***
*** DO NOT ADD PACKAGE OPTIONS, PRICING TIERS, OR NEW SECTIONS ***
*** DO NOT "IMPROVE" OR "ENHANCE" THE PROPOSAL ***

The slides you receive contain the EXACT content the client wants. Your ONLY job is to:
- Add images when asked to add images
- Add new slides when asked to add slides
- Make the SPECIFIC change requested - nothing else

FORBIDDEN ACTIONS (never do these unless explicitly asked):
- Changing budget/investment amounts
- Adding package options or tiers
- Changing deliverables list
- Renaming slides or sections
- Adding new text content
- "Improving" descriptions
- Changing client or project names
- Adding disclaimers or notes

When asked to "add images" or "generate images":
1. Keep EVERY text element EXACTLY as it is (same content, position, size, color)
2. ONLY add image elements or change slide backgrounds
3. Return the slides with 100% identical text content

When asked to add/create NEW slides, return JSON:
{
  "action": "add",
  "insertAfter": <index>,
  "slides": [array of NEW slide objects only],
  "images": [optional array of images to generate],
  "message": "Brief confirmation of what you did"
}

When asked to modify existing slides (including adding images), return JSON:
{
  "action": "modify",
  "slides": [complete slides array - TEXT MUST BE IDENTICAL TO INPUT],
  "images": [optional array of images to generate],
  "message": "Brief confirmation"
}

When asked a question or having a general conversation, return JSON:
{
  "action": "chat",
  "message": "Your conversational response"
}

=== LAYOUT MODIFICATIONS ===
Users may request layout changes like "make it more dramatic", "add more negative space", "use a different layout".

LAYOUT ARCHETYPES:
- MONOLITH: Single massive headline, vast empty space. Great for impact.
- SPLIT_WORLD: 50/50 divide - text left, space/imagery right.
- MAGAZINE_SPREAD: 40% narrow text column + empty space. Elegant focus.
- DASHBOARD: Multiple cards/zones with thin 1px dividers. Data-forward.

When user requests layout changes:
1. You MAY reposition elements (change x, y, width, height)
2. You MAY change font sizes (within hierarchy: 56px hero, 32px titles, 20px cards, 17px body, 13px labels, 11px min)
3. You MAY add/remove accent shapes (thin lines, bars)
4. You MUST preserve all text content exactly
5. You MUST stay within canvas bounds (900x506)

Slide format: { name, archetype, background: { color: "#000000" }, elements: [] }
Text: { type: "text", content, x, y, width, height, fontSize, fontWeight, fontFamily, color, align }
Shape: { type: "shape", shapeType: "rect"|"ellipse", x, y, width, height, color, borderRadius }
Canvas: 900x506px. Colors: black=#000000, gray=#71717A, text=#D4D4D8, white=#FFFFFF, accent=#C41E3A
Fonts: "Inter", "Bebas Neue", "JetBrains Mono". Min font: 11px.
${imageGenInstructions}`
      : `${BRAND_GUIDELINES_SHORT}

${DESIGN_RULES_SHORT}

You are a presentation assistant for VALIDATE helping refine an EXISTING proposal.

=== ABOUT THIS SYSTEM ===
You are powered by Claude Opus 4.5 API from Anthropic. Image generation uses Gemini 3 Pro Image Preview from Google.
If asked what API or model you are using, answer: "I'm powered by Claude Opus 4.5 for text/proposals, and Gemini 3 Pro Image Preview for image generation."

=== ABSOLUTE RULES - VIOLATION IS FAILURE ===

*** DO NOT CHANGE ANY TEXT CONTENT UNLESS EXPLICITLY ASKED ***
*** DO NOT ADD PACKAGE OPTIONS, PRICING TIERS, OR NEW SECTIONS ***
*** DO NOT "IMPROVE" OR "ENHANCE" THE PROPOSAL ***

The slides you receive contain the EXACT content the client wants. Your ONLY job is to:
- Add images when asked to add images
- Make the SPECIFIC change requested - nothing else

FORBIDDEN ACTIONS (never do these unless explicitly asked):
- Changing budget/investment amounts
- Adding package options or tiers
- Changing deliverables list
- Renaming slides or sections
- Adding new text content
- "Improving" descriptions
- Changing client or project names
- Adding disclaimers or notes

When asked to "add images" or "generate images":
1. Keep EVERY text element EXACTLY as it is (same content, position, size, color)
2. ONLY add image elements or change slide backgrounds
3. Return the slides with 100% identical text content

When modifying slides, return JSON:
{
  "action": "modify",
  "slides": [complete slides array - TEXT MUST BE IDENTICAL TO INPUT],
  "images": [optional array of images to generate],
  "message": "Brief confirmation of what you changed"
}

When asked a question or having a general conversation, return JSON:
{
  "action": "chat",
  "message": "Your conversational response"
}

=== LAYOUT MODIFICATIONS ===
Users may request layout changes like "make it more dramatic", "add more negative space", "use a different layout".

LAYOUT ARCHETYPES:
- MONOLITH: Single massive headline, vast empty space. Great for impact.
- SPLIT_WORLD: 50/50 divide - text left, space/imagery right.
- MAGAZINE_SPREAD: 40% narrow text column + empty space. Elegant focus.
- DASHBOARD: Multiple cards/zones with thin 1px dividers. Data-forward.

When user requests layout changes:
1. You MAY reposition elements (change x, y, width, height)
2. You MAY change font sizes (within hierarchy: 56px hero, 32px titles, 20px cards, 17px body, 13px labels, 11px min)
3. You MAY add/remove accent shapes (thin lines, bars)
4. You MUST preserve all text content exactly
5. You MUST stay within canvas bounds (900x506)

Slide format: { name, archetype, background: { color, image, opacity }, elements: [] }
Text: { type: "text", content, x, y, width, height, fontSize, fontWeight, fontFamily, color, align }
Shape: { type: "shape", shapeType: "rect"|"ellipse", x, y, width, height, color, borderRadius }
Canvas: 900x506px. Colors: black=#000000, gray=#71717A, text=#D4D4D8, white=#FFFFFF, accent=#C41E3A
Fonts: "Inter", "Bebas Neue", "JetBrains Mono". Min font: 11px.
${imageGenInstructions}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout

      // Compress the payload to avoid Vercel's body size limits
      const payload = JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        system: systemPrompt,
        messages: apiMessages
      });
      const compressed = pako.gzip(payload);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'gzip',
          'X-Original-Content-Type': 'application/json'
        },
        body: compressed,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const status = response.status;
        if (status === 529 || status === 503) {
          throw new Error('API is busy. Please try again.');
        }
        throw new Error(`API error: ${status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API error');
      }
      
      const text = data.content?.[0]?.text || '';
      
      // Try to parse JSON response
      const objectMatch = text.match(/\{[\s\S]*\}/);
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      
      let responseMessage = 'Done.';
      let resultSlides = null;
      let imageRequests = [];
      let libraryImageRequests = [];

      if (objectMatch) {
        try {
          const parsed = JSON.parse(objectMatch[0]);

          // Extract image requests if present
          if (Array.isArray(parsed.images)) {
            imageRequests = parsed.images;
          }

          // Extract library image requests if present
          if (Array.isArray(parsed.libraryImages)) {
            libraryImageRequests = parsed.libraryImages;
          }

          // Handle different action types
          if (parsed.action === 'chat') {
            // Pure conversational response - no slide changes
            responseMessage = parsed.message || 'I understand. What would you like me to do?';
          } else if (parsed.action === 'add' && Array.isArray(parsed.slides)) {
            // Add new slides
            const insertPos = (parsed.insertAfter ?? slides.length - 1) + 1;
            const newSlides = parsed.slides.map(slide => ({
              ...slide,
              id: generateSlideId(),
              elements: (slide.elements || []).map(el => ({ ...el, id: generateElementId() }))
            }));
            resultSlides = [
              ...slides.slice(0, insertPos),
              ...newSlides,
              ...slides.slice(insertPos)
            ];
            responseMessage = parsed.message || `Added ${newSlides.length} slide${newSlides.length > 1 ? 's' : ''}.`;
          } else if (parsed.action === 'modify' && Array.isArray(parsed.slides)) {
            // Modify slides
            resultSlides = parsed.slides;
            responseMessage = parsed.message || 'Updated the slides.';
          } else if (Array.isArray(parsed)) {
            // Direct array response
            resultSlides = parsed;
          } else {
            // Unknown format with message
            responseMessage = parsed.message || text;
          }
        } catch (e) {
          // JSON parse failed, try array
          if (arrayMatch) {
            try {
              resultSlides = JSON.parse(arrayMatch[0]);
            } catch (e2) {
              // Both parses failed - treat as conversational text
              console.error('JSON parse error:', e2.message);
              responseMessage = text;
            }
          } else {
            // Not JSON - treat as conversational text
            responseMessage = text;
          }
        }
      } else if (arrayMatch) {
        try {
          resultSlides = JSON.parse(arrayMatch[0]);
        } catch (e) {
          // Array parse failed - treat as conversational response
          console.error('JSON array parse error:', e.message);
          responseMessage = text || 'I processed your request.';
        }
      } else {
        // No JSON found - treat as conversational response
        responseMessage = text || 'I processed your request.';
      }

      // Apply slide changes if any
      let finalSlides = null;
      if (resultSlides) {
        // Restore image/video sources that were replaced with placeholders
        // The AI returns [IMG], [VID], [BG_IMAGE] - we need to restore from original slides
        finalSlides = resultSlides.map((slide, slideIndex) => {
          const originalSlide = slides[slideIndex];

          // Restore background image if placeholder
          let background = slide.background;
          if (background?.image === '[BG_IMAGE]' && originalSlide?.background?.image) {
            background = { ...background, image: originalSlide.background.image };
          }

          // Restore element sources
          const elements = (slide.elements || []).map(el => {
            let restoredEl = { ...el, id: el.id || generateElementId() };

            // Find matching original element by type and approximate position
            if (originalSlide) {
              const originalEl = originalSlide.elements.find(orig =>
                orig.type === el.type &&
                (orig.id === el.id || // Match by ID if available
                  (Math.abs((orig.x || 0) - (el.x || 0)) < 50 &&
                   Math.abs((orig.y || 0) - (el.y || 0)) < 50)) // Or by position
              );

              if (originalEl) {
                // Restore image source if placeholder
                if (el.src === '[IMG]' && originalEl.src) {
                  restoredEl.src = originalEl.src;
                }
                // Restore video URL if placeholder
                if (el.videoUrl === '[VID]' && originalEl.videoUrl) {
                  restoredEl.videoUrl = originalEl.videoUrl;
                }
              }
            }

            return restoredEl;
          });

          return {
            ...slide,
            id: slide.id || generateSlideId(),
            background,
            elements
          };
        });

        updateSlides(finalSlides);
        setSelectedElementIds([]);

        if (currentSlideIndex >= finalSlides.length) {
          setCurrentSlideIndex(Math.max(0, finalSlides.length - 1));
        }
      }

      // Add library images if requested (instant - no generation needed)
      let workingSlides = finalSlides || slides;
      if (libraryImageRequests.length > 0) {
        const updatedSlides = [...workingSlides];
        libraryImageRequests.forEach((imgReq) => {
          const slideIndex = imgReq.slideIndex ?? 0;
          if (slideIndex >= updatedSlides.length) return;

          // Look up URL by image name from the library
          let imageUrl = imgReq.url; // Support legacy direct URL format
          if (!imageUrl && imgReq.imageName) {
            const foundImage = libraryImages.find(img =>
              img.name.toLowerCase() === imgReq.imageName.toLowerCase()
            );
            imageUrl = foundImage?.url;
          }
          if (!imageUrl) return;

          if (imgReq.asBackground) {
            updatedSlides[slideIndex] = {
              ...updatedSlides[slideIndex],
              background: {
                ...updatedSlides[slideIndex].background,
                image: imageUrl,
                opacity: imgReq.opacity || 0.3
              }
            };
          } else {
            const imageElement = {
              id: generateElementId(),
              type: 'image',
              src: imageUrl,
              x: imgReq.x || 100,
              y: imgReq.y || 100,
              width: imgReq.width || 400,
              height: imgReq.height || 300
            };
            updatedSlides[slideIndex] = {
              ...updatedSlides[slideIndex],
              elements: [...updatedSlides[slideIndex].elements, imageElement]
            };
          }
        });

        updateSlides(updatedSlides);
        workingSlides = updatedSlides;
        responseMessage += ` Added ${libraryImageRequests.length} image${libraryImageRequests.length > 1 ? 's' : ''} from library.`;
      }

      // Generate AI images if requested
      if (imageRequests.length > 0) {
        responseMessage += ` Generating ${imageRequests.length} image${imageRequests.length > 1 ? 's' : ''}...`;
        setMessages(prev => [...prev, { role: 'assistant', content: responseMessage, id: Date.now() }]);

        // Generate all images in parallel
        const imagePromises = imageRequests.map(async (imgReq, i) => {
          try {
            const response = await fetch('/api/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: imgReq.prompt })
            });

            if (!response.ok) {
              console.error(`Image ${i + 1} failed:`, response.status);
              return null;
            }

            const result = await response.json();
            if (!result.success || !result.image) {
              console.error(`Image ${i + 1} no image in response`);
              return null;
            }

            return {
              ...imgReq,
              imageData: `data:${result.image.mimeType};base64,${result.image.data}`
            };
          } catch (err) {
            console.error(`Image ${i + 1} error:`, err);
            return null;
          }
        });

        const generatedImages = await Promise.all(imagePromises);

        // Add generated images to slides
        const updatedSlides = [...workingSlides];
        generatedImages.forEach((img) => {
          if (!img) return;

          const slideIndex = img.slideIndex ?? 0;
          if (slideIndex >= updatedSlides.length) return;

          if (img.asBackground) {
            updatedSlides[slideIndex] = {
              ...updatedSlides[slideIndex],
              background: {
                ...updatedSlides[slideIndex].background,
                image: img.imageData,
                opacity: 0.3
              }
            };
          } else {
            const imageElement = {
              id: generateElementId(),
              type: 'image',
              src: img.imageData,
              x: img.x || 100,
              y: img.y || 100,
              width: img.width || 400,
              height: img.height || 300
            };
            updatedSlides[slideIndex] = {
              ...updatedSlides[slideIndex],
              elements: [...updatedSlides[slideIndex].elements, imageElement]
            };
          }
        });

        updateSlides(updatedSlides);

        // Immediately save project after generating images (don't wait for auto-save)
        if (currentProjectId) {
          try {
            const saveData = {
              slides: updatedSlides,
              projectName,
              clientName,
              originalNotes,
              expirationDays: proposalExpirationDays,
              contactName,
              contactEmail,
              contactPhone,
              savedAt: new Date().toISOString()
            };
            // Save to Supabase only
            await projectStorage.saveProject(currentProjectId, saveData);
          } catch (saveErr) {
            console.error('Failed to save after image generation:', saveErr);
          }
        }

        const successCount = generatedImages.filter(Boolean).length;
        setMessages(prev => {
          const newMessages = [...prev];
          // Update the last message to show completion
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content: responseMessage.replace(/Generating.*/, `Generated ${successCount}/${imageRequests.length} images. Saved.`)
            };
          }
          return newMessages;
        });
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: responseMessage, id: Date.now() }]);
      }
    } catch (err) {
      console.error('Refine error:', err);
      let msg = 'Something went wrong. Try again.';
      if (err.name === 'AbortError') {
        msg = 'Request timed out. Try breaking it into smaller requests.';
      } else if (err.message?.includes('JSON')) {
        msg = 'The AI response was malformed. Try rephrasing your request or breaking it into smaller steps.';
      } else if (err.message) {
        msg = err.message;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: msg, id: Date.now() }]);
    } finally {
      clearTimeout(failsafeTimeout);
      setIsRefining(false);
    }
  };

  const updateElement = (elementId, updates) => {
    updateSlides(prev => prev.map((slide, idx) => {
      if (idx !== currentSlideIndex) return slide;
      return {
        ...slide,
        elements: slide.elements.map(el => el.id === elementId ? { ...el, ...updates } : el)
      };
    }));
  };

  const updateSlideBackground = (updates) => {
    updateSlides(prev => prev.map((slide, idx) => {
      if (idx !== currentSlideIndex) return slide;
      return { ...slide, background: { ...slide.background, ...updates } };
    }));
  };

  const addTextElement = () => {
    const newElement = {
      id: generateElementId(),
      type: 'text',
      content: 'New Text',
      x: 100,
      y: 200,
      width: 200,
      height: 40,
      fontSize: 16,
      fontWeight: 'normal',
      fontFamily: 'Inter',
      color: COLORS.white,
      align: 'left'
    };
    updateSlides(prev => prev.map((slide, idx) => {
      if (idx !== currentSlideIndex) return slide;
      return { ...slide, elements: [...slide.elements, newElement] };
    }));
    setSelectedElementId(newElement.id);
  };

  const addImageElement = (imageSrc) => {
    const newElement = {
      id: generateElementId(),
      type: 'image',
      src: imageSrc,
      x: 100,
      y: 150,
      width: 300,
      height: 200,
      frameStyle: 'rounded-md'
    };
    updateSlides(prev => prev.map((slide, idx) => {
      if (idx !== currentSlideIndex) return slide;
      return { ...slide, elements: [...slide.elements, newElement] };
    }));
    setSelectedElementId(newElement.id);
  };

  const addVideoElement = (videoUrl) => {
    const newElement = {
      id: generateElementId(),
      type: 'video',
      videoUrl: videoUrl,
      x: 100,
      y: 100,
      width: 480,
      height: 270  // 16:9 aspect ratio
    };
    updateSlides(prev => prev.map((slide, idx) => {
      if (idx !== currentSlideIndex) return slide;
      return { ...slide, elements: [...slide.elements, newElement] };
    }));
    setSelectedElementId(newElement.id);
  };

  const deleteElement = useCallback((elementId) => {
    updateSlides(prev => prev.map((slide, idx) => {
      if (idx !== currentSlideIndex) return slide;
      return { ...slide, elements: slide.elements.filter(el => el.id !== elementId) };
    }));
    setSelectedElementIds([]);
  }, [currentSlideIndex, updateSlides]);

  // Keyboard shortcuts for undo/redo, delete, and slide navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle if we're in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      
      // Arrow keys for slide navigation
      if (e.key === 'ArrowLeft' && slides.length > 0) {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.max(0, prev - 1));
      }
      if (e.key === 'ArrowRight' && slides.length > 0) {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
      }
      
      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      // Delete selected elements (supports multi-select)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        // Delete all selected elements
        selectedElementIds.forEach(id => deleteElement(id));
        setSelectedElementIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedElementIds, deleteElement, slides.length]);

  const addSlide = () => {
    const newSlide = {
      id: generateSlideId(),
      name: `Slide ${slides.length + 1}`,
      background: { color: COLORS.black, image: null, opacity: 1 },
      elements: [
        { id: generateElementId(), type: 'text', content: 'NEW SLIDE', x: 60, y: 50, width: 500, height: 50, fontSize: 32, fontWeight: 'bold', fontFamily: 'Bebas Neue', color: COLORS.white, align: 'left' },
        { id: generateElementId(), type: 'shape', shapeType: 'rect', x: 60, y: 105, width: 100, height: 4, color: COLORS.accent },
      ]
    };
    updateSlides(prev => [...prev.slice(0, currentSlideIndex + 1), newSlide, ...prev.slice(currentSlideIndex + 1)]);
    setCurrentSlideIndex(currentSlideIndex + 1);
    setSelectedElementIds([]);
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    updateSlides(prev => prev.filter((_, idx) => idx !== currentSlideIndex));
    setCurrentSlideIndex(Math.min(currentSlideIndex, slides.length - 2));
    setSelectedElementIds([]);
  };

  const handleNew = async () => {
    // Save current work before clearing
    if (slides.length && currentProjectId) {
      try {
        const saveData = {
          slides,
          projectName,
          clientName,
          originalNotes,
          expirationDays: proposalExpirationDays,
          contactName,
          contactEmail,
          contactPhone,
          savedAt: new Date().toISOString()
        };
        // Save to Supabase only
        await projectStorage.saveProject(currentProjectId, saveData);
      } catch (e) {
        console.error('Save before new failed:', e);
      }
    }

    // Clear project ID FIRST to prevent autosave race condition
    setCurrentProjectId(null);
    currentProjectIdRef.current = null; // Immediately update ref

    setProposal(null);
    setSlides([]);
    setProposalExpirationDays(null); // Reset expiration when creating new
    setHistory([]);
    setHistoryIndex(-1);
    setCurrentSlideIndex(0);
    setSelectedElementIds([]);
    setMessages([]);
    setInputCollapsed(false);
    setProjectName('');
    setClientName('');
    setOriginalNotes('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setEditingMode(null); // Reset editing mode
    setCurrentCaseStudyId(null);
    setShowProjectBrowser(false);
  };

  // Create a new blank proposal with one empty slide
  const handleNewBlank = async () => {
    // Save current work before clearing
    if (slides.length && currentProjectId) {
      try {
        const saveData = {
          slides,
          projectName,
          clientName,
          originalNotes,
          expirationDays: proposalExpirationDays,
          contactName,
          contactEmail,
          contactPhone,
          savedAt: new Date().toISOString()
        };
        await projectStorage.saveProject(currentProjectId, saveData);
      } catch (e) {
        console.error('Save before new failed:', e);
      }
    }

    // Create a blank slide
    const blankSlide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: 'Slide 1',
      background: { color: '#000000' },
      elements: []
    };

    // Create new project
    const newProjectId = `project-${Date.now()}`;
    const newName = 'Untitled Proposal';

    // Clear project ID FIRST to prevent autosave race condition
    setCurrentProjectId(null);
    currentProjectIdRef.current = null;

    setProposal(null);
    setSlides([blankSlide]);
    setProposalExpirationDays(null);
    setHistory([JSON.stringify([blankSlide])]);
    setHistoryIndex(0);
    setCurrentSlideIndex(0);
    setSelectedElementIds([]);
    setMessages([]);
    setInputCollapsed(true); // Collapse since we're not using AI
    setProjectName(newName);
    setClientName('');
    setOriginalNotes('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setEditingMode('proposal');
    setCurrentCaseStudyId(null);
    setShowProjectBrowser(false);

    // Set project ID and save
    setCurrentProjectId(newProjectId);
    currentProjectIdRef.current = newProjectId;

    // Save to storage
    try {
      const projectData = {
        slides: [blankSlide],
        projectName: newName,
        clientName: '',
        originalNotes: '',
        savedAt: new Date().toISOString()
      };

      const newProjectEntry = {
        id: newProjectId,
        name: newName,
        updatedAt: new Date().toISOString(),
        slideCount: 1,
        archived: false
      };

      let latestClients = await projectStorage.loadClientsIndex();
      if (!latestClients) latestClients = clients;

      let updatedClients = [...latestClients];
      let uncategorized = updatedClients.find(c => c.name === 'Uncategorized');
      if (!uncategorized) {
        uncategorized = {
          id: 'client-uncategorized',
          name: 'Uncategorized',
          archived: false,
          createdAt: new Date().toISOString(),
          projects: []
        };
        updatedClients.push(uncategorized);
      }
      uncategorized.projects = [newProjectEntry, ...uncategorized.projects];

      setClients(updatedClients);
      await Promise.all([
        projectStorage.saveClientsIndex(updatedClients),
        projectStorage.saveProject(newProjectId, projectData)
      ]);
    } catch (e) {
      console.error('Save blank project error:', e);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-bg-primary overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.05em; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .scrollbar-dark::-webkit-scrollbar { width: 6px; }
        .scrollbar-dark::-webkit-scrollbar-track { background: #121215; }
        .scrollbar-dark::-webkit-scrollbar-thumb { background: #32323a; border-radius: 3px; }
        
        /* Mobile optimizations */
        * { -webkit-tap-highlight-color: transparent; }
        input, textarea, button { font-size: 16px; }
        
        /* Safe area insets for notched phones */
        @supports (padding-top: env(safe-area-inset-top)) {
          .safe-top { padding-top: env(safe-area-inset-top); }
          .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
        }
        
        /* Touch-friendly scrolling */
        .touch-scroll { -webkit-overflow-scrolling: touch; overflow-y: auto; }
        
        /* Modern focus styles */
        *:focus-visible { outline: 2px solid #ff6b4a; outline-offset: 2px; }
      `}</style>
      
      <Header
        onNew={handleNew}
        hasProposal={slides.length > 0}
        saveStatus={saveStatus}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onShowProjects={() => setShowProjectBrowser(true)}
        onShowCaseStudies={() => {
          setCaseStudyLibraryMode('browse');
          setShowCaseStudyLibrary(true);
        }}
        onShowSaveAs={() => setShowSaveAs(true)}
        onShowImageLibrary={() => {
          setImagePickerMode('element');
          setShowImageLibrary(true);
        }}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        isMobile={isMobile}
        onMobileInput={() => setMobileInputOpen(true)}
        onExportPdf={() => setShowExportModal(true)}
        isExporting={isExporting}
        exportProgress={exportProgress}
        editingMode={editingMode}
        onShare={() => setShowShareModal(true)}
        onSetExpiration={() => setShowExpirationModal(true)}
        expirationDays={proposalExpirationDays}
      />
      
      {/* Image Library Modal */}
      <ImageLibrary
        isOpen={showImageLibrary}
        onClose={() => setShowImageLibrary(false)}
        onSelectImage={(url, asset) => {
          // CRITICAL: Close modal FIRST to prevent state batching issues
          setShowImageLibrary(false);

          if (imagePickerMode === 'background') {
            // Reset position/size when setting new background image
            updateSlideBackground({
              image: url,
              x: 0,
              y: 0,
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT
            });
            setEditingBackground(false);
          } else if (imagePickerMode === 'video') {
            // Attach video to currently selected image element
            // We're in video-only mode, so we know it's a video
            const elementId = selectedElementIds[0];
            if (elementId) {
              updateElement(elementId, { videoSrc: url });
            }
          } else {
            addImageElement(url);
          }
        }}
        filterVideosOnly={imagePickerMode === 'video'}
        onLibraryLoaded={(images, folders) => {
          setLibraryImages(images);
          setLibraryFolders(folders);
        }}
      />
      
      {/* Image Cropper Modal */}
      {croppingElement && (
        <ImageCropper 
          element={croppingElement}
          onSave={updateElement}
          onClose={() => setCroppingElement(null)}
        />
      )}
      
      {/* Project Browser Modal */}
      {showProjectBrowser && (
        <ProjectBrowserModal
          clients={clients}
          currentProjectId={currentProjectId}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived(!showArchived)}
          onLoadProject={loadProject}
          onDeleteProject={deleteProject}
          onDuplicateProject={duplicateProject}
          onArchiveProject={toggleProjectArchive}
          onDeleteClient={deleteClient}
          onArchiveClient={toggleClientArchive}
          deletedProjects={deletedProjects}
          onRestoreProject={restoreProject}
          onPermanentlyDeleteProject={permanentlyDeleteProject}
          onEmptyTrash={emptyProjectTrash}
          onClose={() => setShowProjectBrowser(false)}
          onNew={handleNew}
          onNewBlank={handleNewBlank}
        />
      )}
      
      {/* Save As Modal */}
      {showSaveAs && (
        <SaveAsModal
          currentName={projectName}
          currentClient={clientName}
          clients={clients}
          onSave={saveAsNewProject}
          onClose={() => setShowSaveAs(false)}
        />
      )}

      {/* Case Study Library Modal */}
      {showCaseStudyLibrary && (
        <CaseStudyLibraryModal
          caseStudies={caseStudies}
          onInsert={(csId) => {
            insertCaseStudy(csId);
            setShowCaseStudyLibrary(false);
          }}
          onEdit={(csId) => {
            // Load case study for editing
            loadCaseStudyForEditing(csId);
            setShowCaseStudyLibrary(false);
          }}
          onDelete={deleteCaseStudy}
          onDuplicate={duplicateCaseStudy}
          onClose={() => setShowCaseStudyLibrary(false)}
          mode={caseStudyLibraryMode}
          editingMode={editingMode}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          projectName={projectName}
          clientName={clientName}
          slides={slides}
          contactName={contactName}
          contactEmail={contactEmail}
          contactPhone={contactPhone}
          onContactNameChange={setContactName}
          onContactEmailChange={setContactEmail}
          onContactPhoneChange={setContactPhone}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Export PDF Modal */}
      {showExportModal && (
        <ExportPdfModal
          clientName={clientName}
          contactName={contactName}
          contactEmail={contactEmail}
          contactPhone={contactPhone}
          onContactNameChange={setContactName}
          onContactEmailChange={setContactEmail}
          onContactPhoneChange={setContactPhone}
          onExport={async () => {
            await exportToPdf();
            setShowExportModal(false);
          }}
          onClose={() => setShowExportModal(false)}
          isExporting={isExporting}
          exportProgress={exportProgress}
        />
      )}

      {/* Expiration Modal */}
      {showExpirationModal && (
        <ExpirationModal
          currentDays={proposalExpirationDays}
          onSetDays={handleSetExpiration}
          onClose={() => setShowExpirationModal(false)}
        />
      )}

      {/* Mobile Input Modal */}
      {isMobile && mobileInputOpen && (
        <MobileInputPanel
          onGenerate={(raw, client, project, genBg) => {
            handleGenerate(raw, client, project, genBg);
            setMobileInputOpen(false);
          }}
          onGenerateCaseStudy={(raw, client, project, genBg) => {
            handleGenerateCaseStudy(raw, client, project, genBg);
            setMobileInputOpen(false);
          }}
          isGenerating={isGenerating}
          onClose={() => setMobileInputOpen(false)}
        />
      )}
      
      {/* Mobile Editor Panel */}
      {isMobile && mobileEditorOpen && slides.length > 0 && (
        <MobileEditorPanel
          selectedElement={selectedElement}
          slide={currentSlide}
          onUpdateElement={updateElement}
          onUpdateBackground={updateSlideBackground}
          onAddText={addTextElement}
          onAddImage={addImageElement}
          onDeleteElement={deleteElement}
          onClose={() => setMobileEditorOpen(false)}
          onOpenImageLibrary={() => {
            setImagePickerMode('background');
            setShowImageLibrary(true);
            setMobileEditorOpen(false);
          }}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Input Panel */}
          {!isMobile && (
            <InputPanel collapsed={inputCollapsed} onToggle={() => setInputCollapsed(!inputCollapsed)} onGenerate={handleGenerate} onGenerateCaseStudy={handleGenerateCaseStudy} isGenerating={isGenerating} />
          )}
          
          <div className="flex-1 overflow-hidden bg-neutral-950 flex flex-col">
            {slides.length > 0 ? (
              <SlideEditor
                slide={currentSlide}
                slideIndex={safeSlideIndex}
                totalSlides={slides.length}
                selectedElementIds={selectedElementIds}
                onSelectElement={(id, shiftKey) => {
                  if (shiftKey) {
                    // Shift+click: toggle element in selection
                    setSelectedElementIds(prev =>
                      prev.includes(id)
                        ? prev.filter(x => x !== id)
                        : [...prev, id]
                    );
                  } else {
                    // Regular click: select only this element
                    setSelectedElementIds(id ? [id] : []);
                  }
                  if (isMobile && id) setMobileEditorOpen(true);
                }}
                onUpdateMultipleElements={(updates) => {
                  // Updates is an array of { id, changes }
                  updateSlides(prev => prev.map((slide, idx) => {
                    if (idx !== safeSlideIndex) return slide;
                    return {
                      ...slide,
                      elements: slide.elements.map(el => {
                        const update = updates.find(u => u.id === el.id);
                        return update ? { ...el, ...update.changes } : el;
                      })
                    };
                  }));
                }}
                onUpdateElement={updateElement}
                onDeleteElement={deleteElement}
                onNavigate={setCurrentSlideIndex}
                onAddSlide={addSlide}
                onDeleteSlide={deleteSlide}
                isMobile={isMobile}
                onMobileEdit={() => setMobileEditorOpen(true)}
                onDropImage={addImageElement}
                onOpenCropper={setCroppingElement}
                editingBackground={editingBackground}
                onUpdateBackground={updateSlideBackground}
                editingMode={editingMode}
                onInsertCaseStudy={() => {
                  setCaseStudyLibraryMode('insert');
                  setShowCaseStudyLibrary(true);
                }}
              />
            ) : (
              <EmptyState
                clients={clients}
                caseStudies={caseStudies}
                onLoadProject={loadProject}
                onLoadCaseStudy={loadCaseStudyForEditing}
                onBrowseProjects={() => setShowProjectBrowser(true)}
                isMobile={isMobile}
                onMobileInput={() => setMobileInputOpen(true)}
              />
            )}
          </div>
          
          {/* Desktop Editor Panel */}
          {!isMobile && slides.length > 0 && (
            <EditorPanel
              selectedElement={selectedElement}
              slide={currentSlide}
              onUpdateElement={updateElement}
              onUpdateBackground={updateSlideBackground}
              onAddText={addTextElement}
              onAddImage={addImageElement}
              onAddVideo={addVideoElement}
              onDeleteElement={deleteElement}
              onOpenCropper={setCroppingElement}
              onOpenImageLibrary={() => {
                setImagePickerMode('background');
                setShowImageLibrary(true);
              }}
              onAddImageElement={() => {
                setImagePickerMode('element');
                setShowImageLibrary(true);
              }}
              onAttachVideo={() => {
                setImagePickerMode('video');
                setShowImageLibrary(true);
              }}
              editingBackground={editingBackground}
              onToggleEditBackground={() => setEditingBackground(!editingBackground)}
              selectedElementIds={selectedElementIds}
              onSelectElement={(id) => setSelectedElementIds(id ? [id] : [])}
            />
          )}
        </div>
        
        {slides.length > 0 && <ChatPanel messages={messages} onSend={handleRefine} onClearChat={() => setMessages([])} isRefining={isRefining} isMobile={isMobile} />}
      </div>
      
      {isGenerating && <LoadingOverlay />}
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
      {validationWarnings.length > 0 && (
        <ValidationWarningsToast
          warnings={validationWarnings}
          onClose={() => setValidationWarnings([])}
        />
      )}
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
// HEADER - Cinematic Editorial Design
// ============================================
// EXPIRATION MODAL
function Header({ onNew, hasProposal, saveStatus, projectName, onProjectNameChange, onShowProjects, onShowCaseStudies, onShowSaveAs, onShowImageLibrary, onUndo, onRedo, canUndo, canRedo, isMobile, onMobileInput, onExportPdf, isExporting, exportProgress, editingMode, onShare, onSetExpiration, expirationDays }) {
  const auth = useAuth();

  if (isMobile) {
    return (
      <header className="h-14 bg-bg-secondary/95 backdrop-blur-md border-b border-border text-text-primary flex items-center justify-between px-4">
        {/* Logo with accent */}
        <button onClick={onNew} className="relative hover:opacity-80 transition-opacity group">
          <img src={LOGO_URL} alt="VALIDATE" className="h-5 w-auto" />
          <span className="absolute -bottom-1 left-0 w-4 h-[2px] bg-accent rounded-full group-hover:w-full transition-all duration-300" />
        </button>

        <div className="flex items-center gap-2">
          {!hasProposal && (
            <button onClick={onMobileInput} className="p-2.5 bg-accent rounded-lg hover:shadow-glow transition-all">
              <Plus className="w-5 h-5 text-white" />
            </button>
          )}
          <button onClick={onShowProjects} className="p-2.5 bg-bg-tertiary border border-border rounded-lg hover:border-border-strong transition-all" title="Proposals">
            <FolderOpen className="w-4 h-4 text-text-tertiary" />
          </button>
          <button onClick={onShowCaseStudies} className="p-2.5 bg-bg-tertiary border border-border rounded-lg hover:border-border-strong transition-all" title="Case Studies">
            <Folder className="w-4 h-4 text-text-tertiary" />
          </button>
          {hasProposal && (
            <>
              <button onClick={onShowImageLibrary} className="p-2.5 bg-bg-tertiary border border-border rounded-lg hover:border-border-strong transition-all">
                <ImageIcon className="w-4 h-4 text-text-tertiary" />
              </button>
              <button onClick={onShowSaveAs} className="p-2.5 bg-bg-tertiary border border-border rounded-lg hover:border-border-strong transition-all">
                <Save className="w-4 h-4 text-text-tertiary" />
              </button>
              <button onClick={onShare} className="p-2.5 bg-bg-tertiary border border-border rounded-lg hover:border-border-strong transition-all" title="Share">
                <Link2 className="w-4 h-4 text-text-tertiary" />
              </button>
              <button onClick={onNew} className="p-2.5 bg-bg-tertiary border border-border rounded-lg hover:border-border-strong transition-all">
                <Plus className="w-4 h-4 text-text-tertiary" />
              </button>
            </>
          )}
          <button onClick={() => auth?.logout()} className="p-2.5 bg-bg-tertiary border border-border rounded-lg hover:border-accent/50 transition-all" title="Log Out">
            <LogOut className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 bg-bg-secondary/95 backdrop-blur-md border-b border-border text-text-primary flex items-center justify-between px-6">
      <div className="flex items-center gap-5">
        {/* Logo with signature accent */}
        <button onClick={onNew} className="relative hover:opacity-80 transition-opacity group">
          <img src={LOGO_URL} alt="VALIDATE" className="h-6 w-auto" />
          <span className="absolute -bottom-1 left-0 w-5 h-[2px] bg-accent rounded-full group-hover:w-full transition-all duration-300" />
        </button>

        {/* Tagline badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary rounded-lg border border-border">
          <Sparkles className="w-3 h-3 text-accent" />
          <span className="text-2xs text-text-tertiary font-mono tracking-[0.15em] uppercase">Proposal Builder</span>
        </div>

        {hasProposal && (
          <>
            {/* Divider */}
            <div className="w-px h-6 bg-border" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`flex flex-col items-center px-2 py-1 rounded-lg transition-all ${canUndo ? 'hover:bg-surface-hover text-text-tertiary hover:text-text-primary' : 'text-text-disabled cursor-not-allowed'}`}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
                <span className="text-[8px] uppercase tracking-wider mt-0.5">Undo</span>
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`flex flex-col items-center px-2 py-1 rounded-lg transition-all ${canRedo ? 'hover:bg-surface-hover text-text-tertiary hover:text-text-primary' : 'text-text-disabled cursor-not-allowed'}`}
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-4 h-4" />
                <span className="text-[8px] uppercase tracking-wider mt-0.5">Redo</span>
              </button>
            </div>

            {/* Project name input */}
            <div className="relative group">
              <input
                type="text"
                value={projectName}
                onChange={(e) => onProjectNameChange(e.target.value)}
                placeholder="Project name..."
                className="px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:border-accent focus:ring-2 focus:ring-accent-subtle focus:outline-none w-52 transition-all"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Navigation buttons - ghost style */}
        <div className="flex items-center">
          <button onClick={onShowProjects} className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-hover rounded-lg text-sm group transition-colors">
            <FolderOpen className="w-4 h-4 text-text-tertiary group-hover:text-text-secondary" />
            <span className="text-text-secondary group-hover:text-text-primary">Proposals</span>
          </button>

          <button onClick={onShowCaseStudies} className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-hover rounded-lg text-sm group transition-colors">
            <Folder className="w-4 h-4 text-text-tertiary group-hover:text-text-secondary" />
            <span className="text-text-secondary group-hover:text-text-primary">Case Studies</span>
          </button>

          <button onClick={onShowImageLibrary} className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-hover rounded-lg text-sm group transition-colors">
            <ImageIcon className="w-4 h-4 text-text-tertiary group-hover:text-text-secondary" />
            <span className="text-text-secondary group-hover:text-text-primary">Library</span>
          </button>
        </div>

        {hasProposal && (
          <>
            {/* Divider */}
            <div className="w-px h-5 bg-border" />

            {/* Save Status - minimal */}
            <div className="flex items-center text-xs font-mono">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1.5 text-text-tertiary">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="tracking-wider">SAVING</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1.5 text-status-success">
                  <Check className="w-3 h-3" />
                  <span className="tracking-wider">SAVED</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1.5 text-status-error">
                  <AlertCircle className="w-3 h-3" />
                  <span className="tracking-wider">ERROR</span>
                </span>
              )}
              {!saveStatus && (
                <span className="flex items-center gap-1.5 text-text-muted">
                  <Cloud className="w-3 h-3" />
                  <span className="tracking-wider">AUTO-SAVE</span>
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-border" />

            {/* Action buttons - ghost style */}
            <div className="flex items-center">
              <button onClick={onShowSaveAs} className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-hover rounded-lg text-sm group transition-colors">
                <Save className="w-4 h-4 text-text-tertiary group-hover:text-text-secondary" />
                <span className="text-text-secondary group-hover:text-text-primary">Save As</span>
              </button>

              <button
                onClick={onExportPdf}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-hover rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed group transition-colors"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-text-tertiary" />
                    <span className="text-text-tertiary font-mono text-xs tracking-wider">
                      {exportProgress.total > 0 ? `${exportProgress.current}/${exportProgress.total}` : 'EXPORTING'}
                    </span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 text-text-tertiary group-hover:text-text-secondary" />
                    <span className="text-text-secondary group-hover:text-text-primary">Export PDF</span>
                  </>
                )}
              </button>

              <button onClick={onShare} className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-hover rounded-lg text-sm group transition-colors">
                <Link2 className="w-4 h-4 text-text-tertiary group-hover:text-text-secondary" />
                <span className="text-text-secondary group-hover:text-text-primary">Share</span>
              </button>

              <button
                onClick={onSetExpiration}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm group transition-colors ${expirationDays ? 'bg-accent-subtle text-accent' : 'hover:bg-surface-hover'}`}
              >
                <Clock className={`w-4 h-4 ${expirationDays ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'}`} />
                <span className={expirationDays ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary'}>
                  {expirationDays ? `${expirationDays}d` : 'Expires'}
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-border" />

            {/* New button - prominent */}
            <button onClick={onNew} className="flex items-center gap-2 px-4 py-1.5 bg-accent hover:bg-accent-secondary text-white rounded-lg text-sm font-medium transition-all hover:shadow-glow">
              <Plus className="w-4 h-4" />
              New
            </button>
          </>
        )}

        {/* Logout button - always visible */}
        <button
          onClick={() => auth?.logout()}
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-hover rounded-lg text-sm group transition-colors"
          title="Log Out"
        >
          <LogOut className="w-4 h-4 text-text-tertiary group-hover:text-accent" />
          <span className="text-text-secondary group-hover:text-text-primary">Log Out</span>
        </button>
      </div>
    </header>
  );
}

// ============================================
// EXPIRATION MODAL
// INPUT PANEL - Editorial Left Rail
// ============================================
// EXPIRATION MODAL
function InputPanel({ collapsed, onToggle, onGenerate, onGenerateCaseStudy, isGenerating }) {
  const [rawInput, setRawInput] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');

  if (collapsed) {
    return (
      <div className="w-14 bg-black border-r border-zinc-800/50 flex flex-col items-center py-6">
        <button onClick={onToggle} className="p-2.5 hover:bg-zinc-900/60 rounded-lg transition-all group">
          <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
        </button>
        {/* Vertical label */}
        <div className="mt-8 flex flex-col items-center">
          <span className="font-mono text-[9px] text-zinc-700 tracking-[0.2em] uppercase" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            Project Info
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-black border-r border-zinc-800/50 flex flex-col">
      {/* Header with red accent */}
      <div className="p-5 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-[#C41E3A] rounded-full" style={{ boxShadow: '0 0 10px rgba(196, 30, 58, 0.3)' }} />
          <h2 className="font-display text-lg text-white tracking-[0.1em]">PROJECT INFO</h2>
        </div>
        <button onClick={onToggle} className="p-1.5 hover:bg-zinc-900/60 rounded-md transition-all group">
          <ChevronLeft className="w-5 h-5 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
        </button>
      </div>

      {/* Form fields */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-dark">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 uppercase tracking-[0.15em]">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            Client
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ozark Regional Foundation"
            className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800/60 rounded-lg text-white text-sm placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900/80 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 uppercase tracking-[0.15em]">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            Project
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Dreams Beyond The Walls"
            className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800/60 rounded-lg text-white text-sm placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900/80 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[11px] font-mono text-zinc-500 uppercase tracking-[0.15em]">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            Details
          </label>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Paste meeting notes, emails, or describe the project..."
            className="w-full h-44 px-4 py-3 bg-zinc-900/50 border border-zinc-800/60 rounded-lg resize-none text-white text-sm placeholder-zinc-600 focus:border-zinc-600 focus:bg-zinc-900/80 focus:outline-none transition-all leading-relaxed"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-5 border-t border-zinc-800/50 space-y-3">
        {/* Primary - Generate Proposal */}
        <button
          onClick={() => rawInput.trim() && onGenerate(rawInput, clientName, projectName, false)}
          disabled={!rawInput.trim() || isGenerating}
          className={`relative w-full py-3.5 rounded-lg font-display text-base tracking-[0.1em] flex items-center justify-center gap-3 transition-all overflow-hidden ${
            !rawInput.trim() || isGenerating
              ? 'bg-zinc-900/60 text-zinc-600 border border-zinc-800/60 cursor-not-allowed'
              : 'bg-white text-black hover:shadow-[0_8px_32px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {/* Shimmer effect */}
          {!isGenerating && rawInput.trim() && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
          )}
          <Sparkles className="w-4 h-4 relative z-10" />
          <span className="relative z-10">{isGenerating ? 'GENERATING...' : 'GENERATE PROPOSAL'}</span>
        </button>

        {/* Secondary - Generate Case Study */}
        <button
          onClick={() => rawInput.trim() && onGenerateCaseStudy(rawInput, clientName, projectName, false)}
          disabled={!rawInput.trim() || isGenerating}
          className={`w-full py-3.5 rounded-lg font-display text-base tracking-[0.1em] flex items-center justify-center gap-3 transition-all ${
            !rawInput.trim() || isGenerating
              ? 'bg-transparent text-zinc-700 border border-zinc-800/40 cursor-not-allowed'
              : 'bg-transparent text-zinc-300 border border-zinc-700 hover:border-zinc-500 hover:text-white hover:shadow-[0_4px_20px_rgba(255,255,255,0.05)]'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          {isGenerating ? 'GENERATING...' : 'GENERATE CASE STUDY'}
        </button>

        {/* Helper text */}
        {!rawInput.trim() && (
          <p className="text-center text-zinc-700 text-[11px] mt-3 font-mono tracking-wider">
            Enter project details above
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
// MOBILE INPUT PANEL (Full screen modal)
// ============================================
// EXPIRATION MODAL
function MobileInputPanel({ onGenerate, onGenerateCaseStudy, isGenerating, onClose }) {
  const [rawInput, setRawInput] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="h-14 border-b border-neutral-800 flex items-center justify-between px-4">
        <h2 className="font-display text-lg text-white">NEW PROJECT</h2>
        <button onClick={onClose} className="p-2">
          <X className="w-6 h-6 text-neutral-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-mono text-white uppercase tracking-wider mb-1.5">Client</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client name"
            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-base placeholder-neutral-600 focus:border-white focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-white uppercase tracking-wider mb-1.5">Project</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project name"
            className="w-full px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white text-base placeholder-neutral-600 focus:border-white focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-white uppercase tracking-wider mb-1.5">Details</label>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Paste meeting notes, emails, or describe the project..."
            className="w-full h-48 px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg resize-none text-white text-base placeholder-neutral-600 focus:border-white focus:outline-none"
          />
        </div>
      </div>

      <div className="p-4 border-t border-neutral-800 space-y-3">
        <button
          onClick={() => rawInput.trim() && onGenerate(rawInput, clientName, projectName, false)}
          disabled={!rawInput.trim() || isGenerating}
          className={`w-full py-4 rounded-lg font-display text-lg tracking-widest flex items-center justify-center gap-3 transition-all ${
            !rawInput.trim() || isGenerating
              ? 'bg-neutral-800 text-neutral-500 border border-neutral-700'
              : 'bg-white text-black'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          {isGenerating ? 'GENERATING...' : 'GENERATE PROPOSAL'}
        </button>
        <button
          onClick={() => rawInput.trim() && onGenerateCaseStudy(rawInput, clientName, projectName, false)}
          disabled={!rawInput.trim() || isGenerating}
          className={`w-full py-4 rounded-lg font-display text-lg tracking-widest flex items-center justify-center gap-3 transition-all ${
            !rawInput.trim() || isGenerating
              ? 'bg-neutral-900 text-neutral-600 border border-neutral-800'
              : 'bg-black text-white border border-neutral-600'
          }`}
        >
          <FolderOpen className="w-5 h-5" />
          {isGenerating ? 'GENERATING...' : 'GENERATE CASE STUDY'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
// MOBILE EDITOR PANEL (Bottom sheet)
// ============================================
// EXPIRATION MODAL
function MobileEditorPanel({ selectedElement, slide, onUpdateElement, onUpdateBackground, onAddText, onAddImage, onDeleteElement, onClose, onOpenImageLibrary }) {
  const fileInputRef = useRef(null);

  // BULLETPROOF: Early return if slide is undefined
  if (!slide) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => { onAddImage(ev.target.result); onClose(); };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-black border-t border-zinc-800/50 rounded-t-3xl max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header with red accent */}
        <div className="sticky top-0 bg-black/95 backdrop-blur-sm p-4 border-b border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[2px] h-5 bg-[#C41E3A]" style={{ boxShadow: '0 0 8px rgba(196, 30, 58, 0.4)' }} />
            <h2 className="font-display text-lg text-white tracking-[0.1em]">EDIT</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-zinc-900/60 border border-zinc-800">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Add Elements */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-1 rounded-full bg-zinc-600" />
              <h3 className="text-[11px] font-mono text-zinc-400 uppercase tracking-[0.15em]">Add Element</h3>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { onAddText(); onClose(); }} className="flex-1 py-3 px-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl text-white text-sm flex items-center justify-center gap-2 transition-all duration-200">
                <Type className="w-4 h-4 text-zinc-400" /> Text
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 px-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl text-white text-sm flex items-center justify-center gap-2 transition-all duration-200">
                <Image className="w-4 h-4 text-zinc-400" /> Image
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          {/* Selected Element */}
          {selectedElement && selectedElement.type === 'text' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C41E3A]" style={{ boxShadow: '0 0 6px rgba(196, 30, 58, 0.5)' }} />
                <h3 className="text-[11px] font-mono text-white uppercase tracking-[0.15em]">Selected Text</h3>
              </div>
              <textarea
                value={selectedElement.content}
                onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                className="w-full h-24 px-4 py-3 bg-zinc-900/80 border border-zinc-700 rounded-xl resize-none text-white text-base focus:border-zinc-600 focus:outline-none mb-3 transition-colors"
              />
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => onUpdateElement(selectedElement.id, { fontSize: Math.max(11, selectedElement.fontSize - 2) })}
                  className="px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white text-sm font-mono transition-all duration-200"
                >
                  A-
                </button>
                <button
                  onClick={() => onUpdateElement(selectedElement.id, { fontSize: selectedElement.fontSize + 2 })}
                  className="px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg text-white text-sm font-mono transition-all duration-200"
                >
                  A+
                </button>
                <button
                  onClick={() => onUpdateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className={`px-4 py-2.5 border rounded-lg text-sm transition-all duration-200 ${selectedElement.fontWeight === 'bold' ? 'bg-white text-black border-white' : 'bg-zinc-900/60 border-zinc-800 text-white'}`}
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteElement(selectedElement.id)}
                  className="px-4 py-2.5 bg-[#C41E3A]/10 border border-[#C41E3A]/30 rounded-lg text-[#C41E3A] text-sm flex items-center gap-2 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          )}

          {/* Background */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-1 rounded-full bg-zinc-600" />
              <h3 className="text-[11px] font-mono text-zinc-400 uppercase tracking-[0.15em]">Background</h3>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                {['#000000', '#0A0A0A', '#18181B', '#27272A'].map(color => (
                  <button
                    key={color}
                    onClick={() => onUpdateBackground({ color })}
                    className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 ${slide.background.color === color ? 'border-white shadow-[0_0_12px_rgba(255,255,255,0.2)]' : 'border-zinc-800 hover:border-zinc-700'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                onClick={onOpenImageLibrary}
                className="w-full py-3 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl text-white text-sm flex items-center justify-center gap-2 transition-all duration-200"
              >
                <Image className="w-4 h-4 text-zinc-400" /> Choose Image
              </button>
              {slide?.background.image && (
                <button
                  onClick={() => onUpdateBackground({ image: null })}
                  className="w-full py-3 bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700 rounded-xl text-zinc-400 hover:text-zinc-300 text-sm transition-all duration-200"
                >
                  Remove Image
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
// SLIDE EDITOR (Canvas)
// ============================================
// EXPIRATION MODAL
function SlideEditor({ slide, slideIndex, totalSlides, selectedElementIds, onSelectElement, onUpdateElement, onUpdateMultipleElements, onDeleteElement, onNavigate, onAddSlide, onDeleteSlide, isMobile, onMobileEdit, onDropImage, onOpenCropper, editingBackground, onUpdateBackground, editingMode, onInsertCaseStudy }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewMode, setPreviewMode] = useState('pdf'); // 'pdf' shows images, 'web' shows videos

  // BULLETPROOF: Early return if slide is undefined (prevents crash during undo/state transitions)
  if (!slide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950">
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    );
  }

  // Use refs for drag state to avoid re-renders during drag
  const dragRef = useRef(null);
  const multiDragRef = useRef(null); // For multi-element drag
  const resizeRef = useRef(null);
  const bgDragRef = useRef(null);
  const bgResizeRef = useRef(null);
  const scaleRef = useRef(scale);
  const onUpdateElementRef = useRef(onUpdateElement);
  const onUpdateMultipleElementsRef = useRef(onUpdateMultipleElements);
  const selectedElementIdsRef = useRef(selectedElementIds);
  const [, forceUpdate] = useState(0);

  // Keep refs updated
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { onUpdateElementRef.current = onUpdateElement; }, [onUpdateElement]);
  useEffect(() => { onUpdateMultipleElementsRef.current = onUpdateMultipleElements; }, [onUpdateMultipleElements]);
  useEffect(() => { selectedElementIdsRef.current = selectedElementIds; }, [selectedElementIds]);

  // Handle drop from image library
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    // Check for image library data (stored in window)
    if (window.__draggedLibraryImage && onDropImage) {
      onDropImage(window.__draggedLibraryImage);
      window.__draggedLibraryImage = null;
      return;
    }
    
    // Handle file drops
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    if (imageFile && onDropImage) {
      const reader = new FileReader();
      reader.onload = (e) => onDropImage(e.target.result);
      reader.readAsDataURL(imageFile);
    }
  };

  // Calculate scale for mobile
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 32;
        const containerHeight = containerRef.current.clientHeight - 120;
        const scaleX = containerWidth / CANVAS_WIDTH;
        const scaleY = containerHeight / CANVAS_HEIGHT;
        setScale(Math.min(scaleX, scaleY, 1));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const getEventPosition = useCallback((e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / scaleRef.current,
      y: (clientY - rect.top) / scaleRef.current
    };
  }, []);

  // Define mouse handlers first (before handleMouseDown uses them)
  const handleMouseMove = useCallback((e) => {
    const pos = getEventPosition(e);

    // Handle multi-element drag
    if (multiDragRef.current) {
      const dx = pos.x - multiDragRef.current.startX;
      const dy = pos.y - multiDragRef.current.startY;
      // Update current positions for all elements being dragged
      multiDragRef.current.elements.forEach(el => {
        el.currentX = el.originalX + dx;
        el.currentY = el.originalY + dy;
      });
      forceUpdate(n => n + 1);
      return;
    }

    if (dragRef.current) {
      const dx = pos.x - dragRef.current.startX;
      const dy = pos.y - dragRef.current.startY;
      // Allow elements to be dragged off all edges of the canvas (no boundary constraints)
      dragRef.current.currentX = dragRef.current.originalX + dx;
      dragRef.current.currentY = dragRef.current.originalY + dy;
      forceUpdate(n => n + 1);
    }
    
    if (resizeRef.current) {
      const dx = pos.x - resizeRef.current.startX;
      const dy = pos.y - resizeRef.current.startY;
      const handle = resizeRef.current.handle;
      const isVideo = resizeRef.current.elementType === 'video';
      const aspectRatio = resizeRef.current.aspectRatio;

      if (isVideo) {
        // For videos, lock aspect ratio - use the larger delta to determine size
        const isCornerHandle = (handle.includes('n') || handle.includes('s')) &&
                               (handle.includes('e') || handle.includes('w'));

        if (isCornerHandle) {
          // Corner resize: use diagonal distance to scale proportionally
          let newW, newH;

          if (handle === 'resize-se') {
            // Bottom-right corner
            newW = Math.max(60, resizeRef.current.originalW + dx);
            newH = newW / aspectRatio;
          } else if (handle === 'resize-sw') {
            // Bottom-left corner
            newW = Math.max(60, resizeRef.current.originalW - dx);
            newH = newW / aspectRatio;
            resizeRef.current.currentX = resizeRef.current.originalX + (resizeRef.current.originalW - newW);
          } else if (handle === 'resize-ne') {
            // Top-right corner
            newW = Math.max(60, resizeRef.current.originalW + dx);
            newH = newW / aspectRatio;
            resizeRef.current.currentY = resizeRef.current.originalY + (resizeRef.current.originalH - newH);
          } else if (handle === 'resize-nw') {
            // Top-left corner
            newW = Math.max(60, resizeRef.current.originalW - dx);
            newH = newW / aspectRatio;
            resizeRef.current.currentX = resizeRef.current.originalX + (resizeRef.current.originalW - newW);
            resizeRef.current.currentY = resizeRef.current.originalY + (resizeRef.current.originalH - newH);
          }

          resizeRef.current.currentW = newW;
          resizeRef.current.currentH = newH;
        } else {
          // Edge resize: scale based on edge movement, maintain aspect ratio
          if (handle.includes('e')) {
            const newW = Math.max(60, resizeRef.current.originalW + dx);
            resizeRef.current.currentW = newW;
            resizeRef.current.currentH = newW / aspectRatio;
          } else if (handle.includes('w')) {
            const newW = Math.max(60, resizeRef.current.originalW - dx);
            resizeRef.current.currentW = newW;
            resizeRef.current.currentH = newW / aspectRatio;
            resizeRef.current.currentX = resizeRef.current.originalX + (resizeRef.current.originalW - newW);
          } else if (handle.includes('s')) {
            const newH = Math.max(40, resizeRef.current.originalH + dy);
            resizeRef.current.currentH = newH;
            resizeRef.current.currentW = newH * aspectRatio;
          } else if (handle.includes('n')) {
            const newH = Math.max(40, resizeRef.current.originalH - dy);
            resizeRef.current.currentH = newH;
            resizeRef.current.currentW = newH * aspectRatio;
            resizeRef.current.currentY = resizeRef.current.originalY + (resizeRef.current.originalH - newH);
          }
        }
      } else {
        // Non-video elements: free resize
        if (handle.includes('e')) resizeRef.current.currentW = Math.max(30, resizeRef.current.originalW + dx);
        if (handle.includes('w')) {
          resizeRef.current.currentW = Math.max(30, resizeRef.current.originalW - dx);
          resizeRef.current.currentX = resizeRef.current.originalX + dx;
        }
        if (handle.includes('s')) resizeRef.current.currentH = Math.max(20, resizeRef.current.originalH + dy);
        if (handle.includes('n')) {
          resizeRef.current.currentH = Math.max(20, resizeRef.current.originalH - dy);
          resizeRef.current.currentY = resizeRef.current.originalY + dy;
        }
      }
      forceUpdate(n => n + 1);
    }
  }, [getEventPosition]);

  const handleMouseUp = useCallback(() => {
    // Handle multi-element drag completion
    if (multiDragRef.current) {
      const updates = multiDragRef.current.elements.map(el => ({
        id: el.id,
        changes: { x: el.currentX, y: el.currentY }
      }));
      onUpdateMultipleElementsRef.current(updates);
      multiDragRef.current = null;
    }

    if (dragRef.current) {
      onUpdateElementRef.current(dragRef.current.elementId, {
        x: dragRef.current.currentX,
        y: dragRef.current.currentY
      });
      dragRef.current = null;
    }

    if (resizeRef.current) {
      onUpdateElementRef.current(resizeRef.current.elementId, {
        x: resizeRef.current.currentX,
        y: resizeRef.current.currentY,
        width: resizeRef.current.currentW,
        height: resizeRef.current.currentH
      });
      resizeRef.current = null;
    }

    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    forceUpdate(n => n + 1);
  }, [handleMouseMove]);

  const handleMouseDown = (e, elementId, action = 'move') => {
    e.stopPropagation();
    e.preventDefault();

    // Pass shiftKey to onSelectElement for multi-select
    onSelectElement(elementId, e.shiftKey);

    if (isMobile) return;

    const pos = getEventPosition(e);
    const element = slide.elements.find(el => el.id === elementId);
    if (!element) return;

    if (action === 'move') {
      // Check if this element is part of a multi-selection
      const currentSelectedIds = selectedElementIdsRef.current;
      const isMultiSelect = currentSelectedIds.length > 1 && currentSelectedIds.includes(elementId);

      if (isMultiSelect) {
        // Multi-element drag: track all selected elements
        const elementsToMove = slide.elements.filter(el => currentSelectedIds.includes(el.id));
        multiDragRef.current = {
          startX: pos.x,
          startY: pos.y,
          elements: elementsToMove.map(el => ({
            id: el.id,
            originalX: el.x,
            originalY: el.y,
            currentX: el.x,
            currentY: el.y
          }))
        };
      } else {
        // Single element drag
        dragRef.current = {
          elementId,
          startX: pos.x,
          startY: pos.y,
          originalX: element.x,
          originalY: element.y,
          currentX: element.x,
          currentY: element.y
        };
      }
    } else if (action.startsWith('resize')) {
      resizeRef.current = {
        elementId,
        handle: action,
        startX: pos.x,
        startY: pos.y,
        originalX: element.x,
        originalY: element.y,
        originalW: element.width,
        originalH: element.height,
        currentX: element.x,
        currentY: element.y,
        currentW: element.width,
        currentH: element.height,
        elementType: element.type,
        aspectRatio: element.width / element.height
      };
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Get element position (use drag state if actively dragging)
  const getElementTransform = (element) => {
    // Check multi-drag first
    if (multiDragRef.current) {
      const draggedEl = multiDragRef.current.elements.find(el => el.id === element.id);
      if (draggedEl) {
        return { x: draggedEl.currentX, y: draggedEl.currentY, width: element.width, height: element.height };
      }
    }
    if (dragRef.current && dragRef.current.elementId === element.id) {
      return { x: dragRef.current.currentX, y: dragRef.current.currentY, width: element.width, height: element.height };
    }
    if (resizeRef.current && resizeRef.current.elementId === element.id) {
      return {
        x: resizeRef.current.currentX,
        y: resizeRef.current.currentY,
        width: resizeRef.current.currentW,
        height: resizeRef.current.currentH
      };
    }
    return { x: element.x, y: element.y, width: element.width, height: element.height };
  };

  const isDragging = dragRef.current !== null || resizeRef.current !== null || multiDragRef.current !== null;

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden outline-none bg-zinc-950/50" tabIndex={0}>
      {/* Canvas container with premium shadow treatment */}
      <div
        className={`relative rounded-lg overflow-hidden transition-all duration-300 hover-glow-border ${isDragOver ? 'ring-2 ring-white ring-offset-4 ring-offset-black' : ''}`}
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
          flexShrink: 0,
          cursor: isDragging ? (resizeRef.current ? 'nwse-resize' : 'grabbing') : 'default',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          ref={canvasRef}
          className="relative"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            backgroundColor: slide.background.color,
            transform: `scale(${scale})`,
            transformOrigin: 'top left'
          }}
          onClick={() => !editingBackground && onSelectElement(null)}
        >
          {/* ============================================ */}
          {/* PREMIUM SLIDE OVERLAYS - Film/Tech UI Aesthetic */}
          {/* ============================================ */}

          {/* Film grain texture overlay - very subtle */}
          <div
            className="absolute inset-0 pointer-events-none z-[90] mix-blend-overlay opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
            }}
          />

          {/* Subtle vignette - cinematic darkening at edges */}
          <div
            className="absolute inset-0 pointer-events-none z-[91]"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.15) 100%)'
            }}
          />

          {/* Corner brackets - top left */}
          <div className="absolute pointer-events-none z-[100]" style={{ top: 16, left: 16 }}>
            <div className="absolute w-[20px] h-[1px] bg-white/10" style={{ top: 0, left: 0 }} />
            <div className="absolute w-[1px] h-[20px] bg-white/10" style={{ top: 0, left: 0 }} />
            <div className="absolute w-[3px] h-[3px] rounded-full bg-[#C41E3A]/40" style={{ top: -1, left: -1 }} />
          </div>

          {/* Corner brackets - top right */}
          <div className="absolute pointer-events-none z-[100]" style={{ top: 16, right: 16 }}>
            <div className="absolute w-[20px] h-[1px] bg-white/10" style={{ top: 0, right: 0 }} />
            <div className="absolute w-[1px] h-[20px] bg-white/10" style={{ top: 0, right: 0 }} />
            <div className="absolute w-[3px] h-[3px] rounded-full bg-white/20" style={{ top: -1, right: -1 }} />
          </div>

          {/* Corner brackets - bottom left */}
          <div className="absolute pointer-events-none z-[100]" style={{ bottom: 16, left: 16 }}>
            <div className="absolute w-[20px] h-[1px] bg-white/10" style={{ bottom: 0, left: 0 }} />
            <div className="absolute w-[1px] h-[20px] bg-white/10" style={{ bottom: 0, left: 0 }} />
          </div>

          {/* Corner brackets - bottom right */}
          <div className="absolute pointer-events-none z-[100]" style={{ bottom: 16, right: 16 }}>
            <div className="absolute w-[20px] h-[1px] bg-white/10" style={{ bottom: 0, right: 0 }} />
            <div className="absolute w-[1px] h-[20px] bg-white/10" style={{ bottom: 0, right: 0 }} />
          </div>

          {/* Top edge technical accent line */}
          <div
            className="absolute pointer-events-none z-[100]"
            style={{
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 60,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)'
            }}
          />

          {/* Bottom edge scanline accent */}
          <div
            className="absolute pointer-events-none z-[100]"
            style={{
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 40,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(196,30,58,0.2), transparent)'
            }}
          />

          {/* Micro crosshair - center reference point (very subtle) */}
          <div
            className="absolute pointer-events-none z-[100] opacity-[0.04]"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="absolute w-[8px] h-[1px] bg-white" style={{ top: 0, left: -4 }} />
            <div className="absolute w-[1px] h-[8px] bg-white" style={{ top: -4, left: 0 }} />
          </div>

          {/* Left edge vertical accent */}
          <div
            className="absolute pointer-events-none z-[100]"
            style={{
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 1,
              height: 30,
              background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.06), transparent)'
            }}
          />

          {/* Right edge vertical accent */}
          <div
            className="absolute pointer-events-none z-[100]"
            style={{
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 1,
              height: 30,
              background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.06), transparent)'
            }}
          />
          {/* Background Image Layer */}
          {slide.background.image && (
            <div
              className="absolute"
              style={{
                left: slide.background.x ?? 0,
                top: slide.background.y ?? 0,
                width: slide.background.width ?? CANVAS_WIDTH,
                height: slide.background.height ?? CANVAS_HEIGHT,
                opacity: slide.background.opacity ?? 1,
                pointerEvents: editingBackground ? 'auto' : 'none',
                cursor: editingBackground ? 'move' : 'default',
              }}
              onMouseDown={editingBackground ? (e) => {
                e.stopPropagation();
                const startX = e.clientX;
                const startY = e.clientY;
                const startBgX = slide.background.x ?? 0;
                const startBgY = slide.background.y ?? 0;

                const handleMouseMove = (moveE) => {
                  const dx = (moveE.clientX - startX) / scale;
                  const dy = (moveE.clientY - startY) / scale;
                  onUpdateBackground({
                    x: startBgX + dx,
                    y: startBgY + dy
                  });
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              } : undefined}
            >
              <img
                src={slide.background.image}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
              {/* Resize handles when editing */}
              {editingBackground && (
                <>
                  <div className="absolute inset-0 border-2 border-white pointer-events-none" />
                  {/* Corner resize handles */}
                  {['nw', 'ne', 'sw', 'se'].map(corner => (
                    <div
                      key={corner}
                      className="absolute w-4 h-4 bg-white border border-black rounded-sm"
                      style={{
                        top: corner.includes('n') ? -8 : 'auto',
                        bottom: corner.includes('s') ? -8 : 'auto',
                        left: corner.includes('w') ? -8 : 'auto',
                        right: corner.includes('e') ? -8 : 'auto',
                        cursor: `${corner}-resize`,
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startBgX = slide.background.x ?? 0;
                        const startBgY = slide.background.y ?? 0;
                        const startWidth = slide.background.width ?? CANVAS_WIDTH;
                        const startHeight = slide.background.height ?? CANVAS_HEIGHT;
                        const aspectRatio = startWidth / startHeight;

                        const handleMouseMove = (moveE) => {
                          let dx = (moveE.clientX - startX) / scale;
                          let dy = (moveE.clientY - startY) / scale;

                          // Keep aspect ratio
                          if (Math.abs(dx) > Math.abs(dy)) {
                            dy = dx / aspectRatio;
                          } else {
                            dx = dy * aspectRatio;
                          }

                          let newX = startBgX;
                          let newY = startBgY;
                          let newWidth = startWidth;
                          let newHeight = startHeight;

                          if (corner.includes('e')) {
                            newWidth = Math.max(100, startWidth + dx);
                            newHeight = newWidth / aspectRatio;
                          }
                          if (corner.includes('w')) {
                            const widthChange = -dx;
                            newWidth = Math.max(100, startWidth + widthChange);
                            newHeight = newWidth / aspectRatio;
                            newX = startBgX - (newWidth - startWidth);
                          }
                          if (corner.includes('s') && !corner.includes('e') && !corner.includes('w')) {
                            newHeight = Math.max(100, startHeight + dy);
                            newWidth = newHeight * aspectRatio;
                          }
                          if (corner.includes('n') && !corner.includes('e') && !corner.includes('w')) {
                            const heightChange = -dy;
                            newHeight = Math.max(100, startHeight + heightChange);
                            newWidth = newHeight * aspectRatio;
                            newY = startBgY - (newHeight - startHeight);
                          }
                          if (corner === 'se') {
                            newWidth = Math.max(100, startWidth + dx);
                            newHeight = newWidth / aspectRatio;
                          }
                          if (corner === 'sw') {
                            newWidth = Math.max(100, startWidth - dx);
                            newHeight = newWidth / aspectRatio;
                            newX = startBgX + startWidth - newWidth;
                          }
                          if (corner === 'ne') {
                            newWidth = Math.max(100, startWidth + dx);
                            newHeight = newWidth / aspectRatio;
                            newY = startBgY + startHeight - newHeight;
                          }
                          if (corner === 'nw') {
                            newWidth = Math.max(100, startWidth - dx);
                            newHeight = newWidth / aspectRatio;
                            newX = startBgX + startWidth - newWidth;
                            newY = startBgY + startHeight - newHeight;
                          }

                          onUpdateBackground({
                            x: newX,
                            y: newY,
                            width: newWidth,
                            height: newHeight
                          });
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          )}

          {/* Opacity overlay for background */}
          {slide.background.image && (slide.background.opacity ?? 1) < 1 && !editingBackground && (
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: slide.background.color, opacity: 1 - (slide.background.opacity ?? 1) }} />
          )}

          {/* Drop zone overlay */}
          {isDragOver && (
            <div className="absolute inset-0 bg-white/10 flex items-center justify-center z-50 pointer-events-none">
              <div className="px-6 py-3 bg-white rounded-lg text-black font-medium shadow-lg">
                Drop image here
              </div>
            </div>
          )}
          
          {slide.elements.map(element => {
            const transform = getElementTransform(element);
            return (
              <ElementRenderer
                key={element.id}
                element={{ ...element, x: transform.x, y: transform.y, width: transform.width, height: transform.height }}
                isSelected={selectedElementIds.includes(element.id)}
                onMouseDown={(e, action) => handleMouseDown(e, element.id, action)}
                onUpdateElement={onUpdateElement}
                onDeleteElement={onDeleteElement}
                onOpenCropper={onOpenCropper}
                previewMode={previewMode}
              />
            );
          })}
        </div>
      </div>
      
      {/* Controls - Premium navigation bar */}
      <div className="mt-6 flex flex-col items-center gap-4">
        {/* Navigation with slide indicator - compact design */}
        <div className="flex items-center gap-3">
          {/* PDF/WEB Preview Toggle */}
          <div className="flex items-center gap-1 bg-zinc-900/80 rounded-lg border border-zinc-700/50 px-1 py-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider px-2">Preview</span>
            <div className="flex items-center overflow-hidden rounded">
              <button
                className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all ${
                  previewMode === 'pdf'
                    ? 'bg-white text-black font-medium'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
                onClick={() => setPreviewMode('pdf')}
                title="PDF preview - shows static images"
              >
                PDF
              </button>
              <button
                className={`px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all ${
                  previewMode === 'web'
                    ? 'bg-white text-black font-medium'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
                onClick={() => setPreviewMode('web')}
                title="Web preview - plays videos"
              >
                WEB
              </button>
            </div>
          </div>

          {/* Slide navigation */}
          <div className="flex items-center gap-0.5 px-1.5 py-1 bg-zinc-900/60 rounded-lg border border-zinc-800/50 backdrop-blur-sm panel-atmosphere">
          <button
            onClick={() => onNavigate(Math.max(0, slideIndex - 1))}
            disabled={slideIndex === 0}
            className="p-1.5 rounded-md hover:bg-zinc-800/60 active:bg-zinc-700/60 disabled:opacity-30 disabled:hover:bg-transparent transition-all group press-effect"
          >
            <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          </button>

          {/* Slide counter - minimal */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5">
            <span className="font-mono text-white text-xs tabular-nums">{slideIndex + 1}</span>
            <span className="text-zinc-600 text-xs">/</span>
            <span className="font-mono text-zinc-500 text-xs tabular-nums">{totalSlides}</span>
          </div>

          <button
            onClick={() => onNavigate(Math.min(totalSlides - 1, slideIndex + 1))}
            disabled={slideIndex === totalSlides - 1}
            className="p-1.5 rounded-md hover:bg-zinc-800/60 active:bg-zinc-700/60 disabled:opacity-30 disabled:hover:bg-transparent transition-all group press-effect"
          >
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          </button>
          </div>
        </div>

        {/* Secondary controls row */}
        <div className="flex items-center gap-3">
          {/* Mobile Edit Button */}
          {isMobile && (
            <button onClick={onMobileEdit} className="px-5 py-2.5 bg-white text-black rounded-lg font-display tracking-wider flex items-center gap-2 hover:shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition-all">
              <Edit3 className="w-4 h-4" /> EDIT
            </button>
          )}

          {/* Desktop buttons */}
          {!isMobile && (
            <>
              <button onClick={onAddSlide} className="px-2.5 py-1.5 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/60 hover:border-zinc-700 rounded-md text-zinc-300 text-[11px] flex items-center gap-1.5 transition-all group btn-interactive press-effect">
                <Plus className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" /> Add Slide
              </button>
              {editingMode === 'proposal' && onInsertCaseStudy && (
                <button onClick={onInsertCaseStudy} className="px-2.5 py-1.5 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/60 hover:border-zinc-700 rounded-md text-zinc-300 text-[11px] flex items-center gap-1.5 transition-all group btn-interactive press-effect">
                  <Folder className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" /> Insert Case Study
                </button>
              )}
              {totalSlides > 1 && (
                <button onClick={onDeleteSlide} className="px-2.5 py-1.5 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/60 hover:border-red-900/50 rounded-md text-zinc-500 hover:text-red-400 text-[11px] flex items-center gap-1.5 transition-all press-effect">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// AUTO-EXPANDING TEXTAREA - PowerPoint-style text editing
// ============================================
const AutoExpandingTextarea = React.forwardRef(function AutoExpandingTextarea({ value, onChange, onBlur, onKeyDown, onSelect, onKeyUp, element, onUpdateElement, style }, ref) {
  const textareaRef = useRef(null);
  const [height, setHeight] = useState(element.height);
  
  // Combine refs
  React.useImperativeHandle(ref, () => textareaRef.current);

  // Auto-resize function
  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height based on content
    const scrollHeight = textarea.scrollHeight;
    const minHeight = element.height;
    const newHeight = Math.max(scrollHeight, minHeight);
    
    // Update textarea height
    textarea.style.height = newHeight + 'px';
    setHeight(newHeight);
    
    // Update element height if it grew beyond original
    if (newHeight > element.height) {
      onUpdateElement(element.id, { height: newHeight });
    }
  }, [element.height, element.id, onUpdateElement]);

  // Resize on mount, when value changes, and on window resize
  useEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  // Handle keydown to resize on Enter key
  const handleKeyDown = (e) => {
    // Schedule resize after Enter key creates new line
    if (e.key === 'Enter') {
      setTimeout(resizeTextarea, 0);
    }
    // Call original handler
    onKeyDown(e);
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    // Resize will happen in the useEffect
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      onSelect={onSelect}
      onKeyUp={onKeyUp}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="w-full bg-transparent border-none outline-none resize-none overflow-hidden"
      style={{ 
        ...style, 
        height: height,
        minHeight: element.height,
        lineHeight: '1.2',
        whiteSpace: 'pre-wrap'
      }}
    />
  );
});

// ============================================
// ELEMENT RENDERER
// ============================================
function ElementRenderer({ element, isSelected, onMouseDown, onUpdateElement, onDeleteElement, onOpenCropper, previewMode = 'pdf' }) {
  const [editing, setEditing] = useState(false);
  const [textSelection, setTextSelection] = useState(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const inputRef = useRef(null);
  const linkInputRef = useRef(null);
  const videoPreviewRef = useRef(null);

  // Use slide-level preview mode to determine if video should play
  const showVideo = previewMode === 'web' && element.videoSrc;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Focus link input when entering link mode
  useEffect(() => {
    if (linkMode && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [linkMode]);

  // Track text selection changes
  const handleTextSelect = () => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart;
      const end = inputRef.current.selectionEnd;
      const selectedText = element.content.substring(start, end);
      if (start !== end && selectedText.length > 0) {
        setTextSelection({ start, end, text: selectedText });
      } else {
        setTextSelection(null);
        setLinkMode(false);
        setLinkUrl('');
      }
    }
  };

  // Handle adding link to selected text
  const handleAddLink = () => {
    if (!textSelection || !linkUrl.trim()) return;

    const url = linkUrl.trim().startsWith('http') || linkUrl.trim().startsWith('mailto:')
      ? linkUrl.trim()
      : `https://${linkUrl.trim()}`;

    const newLink = { start: textSelection.start, end: textSelection.end, url };
    const existingLinks = element.links || [];
    // Remove overlapping links
    const filteredLinks = existingLinks.filter(link =>
      !(link.start < newLink.end && link.end > newLink.start)
    );

    onUpdateElement(element.id, { links: [...filteredLinks, newLink] });
    setLinkMode(false);
    setLinkUrl('');
    setTextSelection(null);
    // Refocus textarea
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleDoubleClick = (e) => {
    if (element.type === 'text') {
      e.stopPropagation();
      setEditing(true);
    }
  };

  const handleBlur = (e) => {
    // Don't end editing if clicking within our toolbar
    if (e.relatedTarget?.closest('.text-edit-toolbar')) {
      return;
    }
    setEditing(false);
    setTextSelection(null);
    setLinkMode(false);
    setLinkUrl('');
  };

  const handleKeyDown = (e) => {
    // Allow Enter key to create new lines (PowerPoint-style)
    // Only exit edit mode on Escape key
    if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
  };

  const baseStyle = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    cursor: isSelected ? 'move' : 'pointer'
  };

  if (element.type === 'shape') {
    const shapeStyle = {
      ...baseStyle,
      backgroundColor: element.color,
      borderRadius: element.shapeType === 'ellipse' ? '50%' : 0
    };
    return (
      <div style={shapeStyle} onClick={handleClick} onMouseDown={(e) => onMouseDown(e, 'move')}>
        {isSelected && <SelectionHandles onMouseDown={onMouseDown} />}
      </div>
    );
  }

  if (element.type === 'svg') {
    return (
      <div style={baseStyle} onClick={handleClick} onMouseDown={(e) => onMouseDown(e, 'move')}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${element.width} ${element.height}`}
          preserveAspectRatio="none"
        >
          <path 
            d={element.path} 
            fill="none" 
            stroke={element.color} 
            strokeWidth={element.strokeWidth || 1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {isSelected && <SelectionHandles onMouseDown={onMouseDown} />}
      </div>
    );
  }

  if (element.type === 'image') {
    // Image style presets
    const getImageStyles = () => {
      const style = element.frameStyle || 'none';
      const base = { overflow: 'hidden', opacity: element.opacity ?? 1 };
      
      switch (style) {
        case 'rounded-sm':
          return { ...base, borderRadius: 4 };
        case 'rounded-md':
          return { ...base, borderRadius: 8 };
        case 'rounded-lg':
          return { ...base, borderRadius: 16 };
        case 'rounded-full':
          return { ...base, borderRadius: '50%' };
        case 'border-thin':
          return { ...base, border: '1px solid rgba(255,255,255,0.2)' };
        case 'border-white':
          return { ...base, border: '2px solid #fff' };
        case 'shadow':
          return { ...base, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' };
        case 'shadow-glow':
          return { ...base, boxShadow: '0 0 30px rgba(255,255,255,0.15)' };
        case 'validate':
          return { ...base, paddingLeft: 8 };
        default:
          return base;
      }
    };

    // Crop settings (position as percentage 0-100, 50 = centered)
    const cropZoom = element.cropZoom || 1;
    const cropX = element.cropX !== undefined ? element.cropX : 50;
    const cropY = element.cropY !== undefined ? element.cropY : 50;

    const handleImageDoubleClick = (e) => {
      e.stopPropagation();
      if (onOpenCropper) {
        onOpenCropper(element);
      }
    };
    
    return (
      <div
        style={baseStyle}
        onClick={handleClick}
        onMouseDown={(e) => onMouseDown(e, 'move')}
        onDoubleClick={handleImageDoubleClick}
      >
        <div className="relative w-full h-full" style={getImageStyles()}>
          {element.frameStyle === 'validate' && (
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white" style={{ borderRadius: 1 }} />
          )}

          {/* Show video if in WEB preview mode and videoSrc exists, otherwise show image */}
          {showVideo ? (
            <video
              ref={videoPreviewRef}
              src={element.videoSrc}
              className="w-full h-full"
              style={{
                marginLeft: element.frameStyle === 'validate' ? 8 : 0,
                borderRadius: 'inherit',
                objectFit: 'cover',
              }}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={resolveImageSrc(element.src)}
              alt=""
              className="w-full h-full"
              draggable={false}
              style={{
                marginLeft: element.frameStyle === 'validate' ? 8 : 0,
                borderRadius: 'inherit',
                objectFit: isLogoImage(element.src) ? 'contain' : 'cover',
                objectPosition: isLogoImage(element.src) ? 'center' : `${cropX}% ${cropY}%`,
                transform: isLogoImage(element.src) ? 'none' : `scale(${cropZoom})`,
                transformOrigin: `${cropX}% ${cropY}%`
              }}
            />
          )}

          {/* Video indicator badge when element has video attached */}
          {element.videoSrc && !showVideo && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/70 rounded text-[9px] font-mono text-zinc-400 z-10">
              <Video className="w-3 h-3" />
            </div>
          )}
        </div>

        {isSelected && <SelectionHandles onMouseDown={onMouseDown} />}
      </div>
    );
  }

  if (element.type === 'video') {
    // Parse video URL to get embed URL
    const getEmbedUrl = (url) => {
      if (!url) return null;

      // YouTube
      const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
      }

      // Vimeo - handle unlisted videos with hash (e.g., vimeo.com/123456789/abcdef123)
      const vimeoUnlistedMatch = url.match(/vimeo\.com\/(\d+)\/([a-zA-Z0-9]+)/);
      if (vimeoUnlistedMatch) {
        return `https://player.vimeo.com/video/${vimeoUnlistedMatch[1]}?h=${vimeoUnlistedMatch[2]}`;
      }

      // Vimeo - regular public videos
      const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
      if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      }

      return null;
    };

    const embedUrl = getEmbedUrl(element.videoUrl);
    const [isHovered, setIsHovered] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [isUploadingThumb, setIsUploadingThumb] = useState(false);
    const thumbInputRef = useRef(null);

    // Exit edit mode when deselected
    useEffect(() => {
      if (!isSelected) {
        setEditMode(false);
      }
    }, [isSelected]);

    // Handle PDF thumbnail upload to Supabase (separate from image library)
    const handleThumbnailUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploadingThumb(true);
      try {
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;
        const STORAGE_BUCKET = 'validate-images';

        // Generate unique filename in video-thumbnails subfolder
        const ext = file.name.split('.').pop();
        const filename = `video-thumbnails/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

        // Upload to Supabase
        const uploadResponse = await fetch(
          `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filename}`,
          {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': file.type,
              'x-upsert': 'true'
            },
            body: file
          }
        );

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        // Get public URL and update element
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filename}`;
        onUpdateElement(element.id, { pdfThumbnail: publicUrl });
      } catch (err) {
        console.error('Thumbnail upload error:', err);
      } finally {
        setIsUploadingThumb(false);
        // Reset input
        if (thumbInputRef.current) thumbInputRef.current.value = '';
      }
    };

    // Quick action handlers
    const handleEnterEditMode = (e) => {
      e.stopPropagation();
      setEditMode(true);
    };

    const handleCenter = (e) => {
      e.stopPropagation();
      const newX = (900 - element.width) / 2;
      const newY = (506 - element.height) / 2;
      onUpdateElement(element.id, { x: newX, y: newY });
    };

    const handleFillSlide = (e) => {
      e.stopPropagation();
      onUpdateElement(element.id, { x: 0, y: 0, width: 900, height: 506 });
    };

    const handleDelete = (e) => {
      e.stopPropagation();
      onDeleteElement(element.id);
    };

    return (
      <div
        style={baseStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={editMode ? (e) => onMouseDown(e, 'move') : undefined}
      >
        <div className="relative w-full h-full bg-black rounded overflow-hidden">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ pointerEvents: editMode ? 'none' : 'auto' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-500">
              <div className="text-center">
                <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Paste video URL in panel</p>
              </div>
            </div>
          )}

          {/* Edit mode overlay - blocks video interaction and shows drag hint */}
          {editMode && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-move">
              <div className="px-4 py-2 bg-black/90 rounded-lg text-white text-sm font-medium shadow-xl">
                Drag to move • Corners to resize
              </div>
            </div>
          )}

          {/* Selection indicator when in edit mode */}
          {editMode && (
            <div className="absolute inset-0 border-2 border-white/80 rounded pointer-events-none" />
          )}
        </div>

        {/* Hover toolbar - positioned inside video bounds in top-right corner */}
        {(isHovered || isSelected) && !editMode && (
          <div
            className="absolute top-2 right-2 flex gap-1 z-50"
            onMouseEnter={() => setIsHovered(true)}
          >
            <button
              onClick={handleEnterEditMode}
              className="p-2 bg-black/80 hover:bg-black text-white rounded-lg shadow-lg transition-colors backdrop-blur-sm"
              title="Edit / Move / Resize"
            >
              <Move className="w-4 h-4" />
            </button>
            <button
              onClick={handleCenter}
              className="p-2 bg-black/80 hover:bg-black text-white rounded-lg shadow-lg transition-colors backdrop-blur-sm"
              title="Center on slide"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={handleFillSlide}
              className="p-2 bg-black/80 hover:bg-black text-white rounded-lg shadow-lg transition-colors backdrop-blur-sm"
              title="Fill slide"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {/* PDF Thumbnail upload button */}
            <label
              className={`p-2 rounded-lg shadow-lg transition-colors backdrop-blur-sm cursor-pointer ${
                element.pdfThumbnail
                  ? 'bg-green-600/80 hover:bg-green-600 text-white'
                  : 'bg-black/80 hover:bg-black text-white'
              } ${isUploadingThumb ? 'opacity-50 pointer-events-none' : ''}`}
              title={element.pdfThumbnail ? "PDF thumbnail set - click to change" : "Upload PDF thumbnail"}
            >
              {isUploadingThumb ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailUpload}
              />
            </label>
            <button
              onClick={handleDelete}
              className="p-2 bg-black/80 hover:bg-red-600 text-white rounded-lg shadow-lg transition-colors backdrop-blur-sm"
              title="Delete video"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {editMode && <SelectionHandles onMouseDown={onMouseDown} />}
      </div>
    );
  }

  // Text element - use minHeight instead of height so text can grow
  const textStyle = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    minHeight: element.height,
    cursor: isSelected ? 'move' : 'pointer',
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    fontFamily: element.fontFamily === 'Bebas Neue' ? "'Bebas Neue', sans-serif" : element.fontFamily === 'JetBrains Mono' ? "'JetBrains Mono', monospace" : "'Inter', sans-serif",
    color: element.color,
    textAlign: element.align,
    fontStyle: element.fontStyle || 'normal',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: element.align === 'center' ? 'center' : element.align === 'right' ? 'flex-end' : 'flex-start',
    lineHeight: 1.2
  };

  return (
    <div
      style={textStyle}
      onClick={handleClick}
      onMouseDown={(e) => onMouseDown(e, 'move')}
      onDoubleClick={handleDoubleClick}
    >
      {/* Floating toolbar for text editing */}
      {editing && textSelection && (
        <div
          className="text-edit-toolbar absolute -top-12 left-0 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-1.5 flex items-center gap-1.5 z-50"
          onMouseDown={(e) => e.preventDefault()} // Prevent focus theft from textarea
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
        >
          {linkMode ? (
            <>
              <input
                ref={linkInputRef}
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddLink();
                  if (e.key === 'Escape') { setLinkMode(false); setLinkUrl(''); inputRef.current?.focus(); }
                }}
                placeholder="Enter URL"
                className="px-2 py-1 bg-zinc-800 border border-zinc-600 rounded text-white text-xs w-44 focus:outline-none focus:border-zinc-500"
              />
              <button
                onClick={handleAddLink}
                disabled={!linkUrl.trim()}
                className="p-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded text-white transition-colors"
                title="Add link"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setLinkMode(false); setLinkUrl(''); inputRef.current?.focus(); }}
                className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setLinkMode(true)}
              className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
              title="Add link to selected text"
            >
              <Link2 className="w-4 h-4" />
              <span className="text-xs">Link</span>
            </button>
          )}
        </div>
      )}

      {editing ? (
        <AutoExpandingTextarea
          ref={inputRef}
          value={element.content}
          onChange={(value) => onUpdateElement(element.id, { content: value })}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onSelect={handleTextSelect}
          onKeyUp={handleTextSelect}
          element={element}
          onUpdateElement={onUpdateElement}
          style={{ fontSize: 'inherit', fontWeight: 'inherit', fontFamily: 'inherit', color: 'inherit', textAlign: 'inherit' }}
        />
      ) : (
        <span style={{ whiteSpace: 'pre-wrap' }}>
          <RenderTextWithLinks content={element.content} links={element.links} linkColor={element.linkColor || '#3B82F6'} />
        </span>
      )}
      {isSelected && <SelectionHandles onMouseDown={onMouseDown} />}
    </div>
  );
}

// Helper to render text with inline links styled
function RenderTextWithLinks({ content, links, linkColor }) {
  if (!links || links.length === 0) {
    return content;
  }

  // Sort links by start position
  const sortedLinks = [...links].sort((a, b) => a.start - b.start);
  const parts = [];
  let lastEnd = 0;

  for (const link of sortedLinks) {
    // Add text before this link
    if (link.start > lastEnd) {
      parts.push(<span key={`text-${lastEnd}`}>{content.substring(lastEnd, link.start)}</span>);
    }
    // Add the linked text
    parts.push(
      <span
        key={`link-${link.start}`}
        style={{ color: linkColor, textDecoration: 'underline', cursor: 'pointer' }}
        title={link.url}
      >
        {content.substring(link.start, link.end)}
      </span>
    );
    lastEnd = link.end;
  }

  // Add remaining text after last link
  if (lastEnd < content.length) {
    parts.push(<span key={`text-${lastEnd}`}>{content.substring(lastEnd)}</span>);
  }

  return <>{parts}</>;
}

// ============================================
// EXPIRATION MODAL
// SELECTION HANDLES
// ============================================
// EXPIRATION MODAL
function SelectionHandles({ onMouseDown }) {
  const handleStyle = "absolute w-2 h-2 bg-white rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_2px_4px_rgba(0,0,0,0.2)]";
  const handleClick = (e) => e.stopPropagation();
  return (
    <>
      {/* Selection border with subtle glow */}
      <div className="absolute inset-0 border border-white/80 pointer-events-none" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.1)' }} />
      {/* Corner handles */}
      <div className={`${handleStyle} -top-1 -left-1 cursor-nw-resize hover:bg-[#C41E3A] transition-colors`} onClick={handleClick} onMouseDown={(e) => onMouseDown(e, 'resize-nw')} />
      <div className={`${handleStyle} -top-1 -right-1 cursor-ne-resize hover:bg-[#C41E3A] transition-colors`} onClick={handleClick} onMouseDown={(e) => onMouseDown(e, 'resize-ne')} />
      <div className={`${handleStyle} -bottom-1 -left-1 cursor-sw-resize hover:bg-[#C41E3A] transition-colors`} onClick={handleClick} onMouseDown={(e) => onMouseDown(e, 'resize-sw')} />
      <div className={`${handleStyle} -bottom-1 -right-1 cursor-se-resize hover:bg-[#C41E3A] transition-colors`} onClick={handleClick} onMouseDown={(e) => onMouseDown(e, 'resize-se')} />
      {/* Edge handles */}
      <div className={`${handleStyle} -top-1 left-1/2 -translate-x-1/2 cursor-n-resize hover:bg-[#C41E3A] transition-colors`} onClick={handleClick} onMouseDown={(e) => onMouseDown(e, 'resize-n')} />
      <div className={`${handleStyle} -bottom-1 left-1/2 -translate-x-1/2 cursor-s-resize hover:bg-[#C41E3A] transition-colors`} onClick={handleClick} onMouseDown={(e) => onMouseDown(e, 'resize-s')} />
      <div className={`${handleStyle} top-1/2 -left-1 -translate-y-1/2 cursor-w-resize hover:bg-[#C41E3A] transition-colors`} onClick={handleClick} onMouseDown={(e) => onMouseDown(e, 'resize-w')} />
      <div className={`${handleStyle} top-1/2 -right-1 -translate-y-1/2 cursor-e-resize hover:bg-[#C41E3A] transition-colors`} onClick={handleClick} onMouseDown={(e) => onMouseDown(e, 'resize-e')} />
    </>
  );
}

// ============================================
// EXPIRATION MODAL
// EDITOR PANEL
// ============================================
// EXPIRATION MODAL
function EditorPanel({ selectedElement, slide, onUpdateElement, onUpdateBackground, onAddText, onAddImage, onAddVideo, onDeleteElement, onOpenCropper, onOpenImageLibrary, onAddImageElement, onAttachVideo, editingBackground, onToggleEditBackground, selectedElementIds, onSelectElement }) {
  const fileInputRef = useRef(null);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  // BULLETPROOF: Early return if slide is undefined
  if (!slide) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => onAddImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddVideo = () => {
    if (videoUrl.trim()) {
      onAddVideo(videoUrl.trim());
      setVideoUrl('');
      setShowVideoInput(false);
    }
  };

  return (
    <div className="w-56 bg-black border-l border-zinc-800/50 flex flex-col overflow-hidden panel-side panel-side-left">
      {/* Panel Header with red accent */}
      <div className="relative px-3 py-3 border-b border-zinc-800/50">
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#C41E3A]" style={{ boxShadow: '0 0 8px rgba(196, 30, 58, 0.4)' }} />
        <h2 className="font-display text-sm text-white tracking-[0.1em] pl-2">EDIT</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-dark">
        {/* Add Elements */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-1 rounded-full bg-zinc-600" />
            <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">Add Element</h3>
          </div>
          <div className="flex gap-1.5 mb-1.5">
            <button onClick={onAddText} className="flex-1 py-2 px-2 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-md text-white text-[11px] flex items-center justify-center gap-1.5 transition-all duration-200">
              <Type className="w-3 h-3 text-zinc-400" /> Text
            </button>
            <button onClick={onAddImageElement} className="flex-1 py-2 px-2 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-md text-white text-[11px] flex items-center justify-center gap-1.5 transition-all duration-200">
              <Image className="w-3 h-3 text-zinc-400" /> Image
            </button>
          </div>
          <button
            onClick={() => setShowVideoInput(!showVideoInput)}
            className={`w-full py-2 px-2 rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-all duration-200 ${
              showVideoInput
                ? 'bg-white text-black font-medium'
                : 'bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 text-white'
            }`}
          >
            <Video className={`w-3 h-3 ${showVideoInput ? '' : 'text-zinc-400'}`} /> Video
          </button>
          {showVideoInput && (
            <div className="mt-2 space-y-1.5 p-2 bg-zinc-900/40 rounded-md border border-zinc-800/50">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste YouTube or Vimeo URL"
                className="w-full px-2 py-1.5 bg-zinc-900/80 border border-zinc-700 rounded-md text-white text-[11px] placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
              />
              <button
                onClick={handleAddVideo}
                disabled={!videoUrl.trim()}
                className="w-full py-1.5 px-2 bg-white text-black rounded-md text-[11px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_4px_12px_rgba(255,255,255,0.1)] transition-all duration-200"
              >
                Add Video
              </button>
            </div>
          )}
        </div>

        {/* Background */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-1 rounded-full bg-zinc-600" />
            <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">Background</h3>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1 block">Color</label>
              <div className="relative">
                <input
                  type="color"
                  value={slide?.background.color || '#000000'}
                  onChange={(e) => onUpdateBackground({ color: e.target.value })}
                  className="w-full h-7 rounded-md cursor-pointer border border-zinc-800 bg-zinc-900"
                />
              </div>
            </div>
            <button onClick={onOpenImageLibrary} className="w-full py-2 px-2 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-md text-white text-[11px] flex items-center justify-center gap-1.5 transition-all duration-200">
              <Image className="w-3 h-3 text-zinc-400" /> Choose Image
            </button>
            {slide?.background.image && (
              <>
                <button
                  onClick={onToggleEditBackground}
                  className={`w-full py-2 px-2 rounded-md text-[11px] flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    editingBackground
                      ? 'bg-white text-black font-medium'
                      : 'bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 text-white'
                  }`}
                >
                  <Move className={`w-3 h-3 ${editingBackground ? '' : 'text-zinc-400'}`} />
                  {editingBackground ? 'Done' : 'Resize & Position'}
                </button>
                <div className="py-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Opacity</span>
                    <span className="font-mono text-zinc-400">{Math.round((slide.background.opacity || 1) * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0" max="1" step="0.05"
                    value={slide.background.opacity || 1}
                    onChange={(e) => onUpdateBackground({ opacity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <button onClick={() => onUpdateBackground({ image: null })} className="w-full py-1.5 px-2 bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/50 hover:border-zinc-700 rounded-md text-zinc-400 hover:text-zinc-300 text-[11px] transition-all duration-200">
                  Remove Image
                </button>
              </>
            )}
          </div>
        </div>

        {/* Layers - All Elements on Slide */}
        {slide?.elements?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-1 rounded-full bg-zinc-600" />
              <h3 className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">Layers</h3>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-dark">
              {slide.elements.map((el, idx) => {
                const isSelected = selectedElementIds?.includes(el.id);
                const isOffCanvas = el.x < 0 || el.y < 0 || el.x > 900 || el.y > 506;
                return (
                  <div
                    key={el.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150 group ${
                      isSelected
                        ? 'bg-white/10 border border-zinc-700'
                        : 'hover:bg-zinc-800/60 border border-transparent'
                    }`}
                    onClick={() => onSelectElement(el.id)}
                  >
                    <span className="text-zinc-500 text-[9px] font-mono w-4">{idx + 1}</span>
                    {el.type === 'text' && <Type className="w-3 h-3 text-zinc-400 flex-shrink-0" />}
                    {el.type === 'image' && <Image className="w-3 h-3 text-zinc-400 flex-shrink-0" />}
                    {el.type === 'video' && <Video className="w-3 h-3 text-zinc-400 flex-shrink-0" />}
                    {el.type === 'shape' && <div className="w-3 h-3 rounded-sm bg-zinc-400 flex-shrink-0" />}
                    <span className={`text-[10px] truncate flex-1 ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                      {el.type === 'text' ? (el.content?.substring(0, 20) || 'Text') + (el.content?.length > 20 ? '...' : '') : el.type}
                    </span>
                    {isOffCanvas && (
                      <span className="text-[8px] text-amber-500 font-mono">OFF</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteElement(el.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Element Properties */}
        {selectedElement && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C41E3A]" style={{ boxShadow: '0 0 6px rgba(196, 30, 58, 0.5)' }} />
              <h3 className="text-[10px] font-mono text-white uppercase tracking-[0.15em]">
                {selectedElement.type === 'text' ? 'Text' : selectedElement.type === 'image' ? 'Image' : selectedElement.type === 'video' ? 'Video' : 'Shape'} Properties
              </h3>
            </div>

            {selectedElement.type === 'text' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1 block">Font Size</label>
                  <input
                    type="number"
                    value={selectedElement.fontSize}
                    onChange={(e) => onUpdateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 12 })}
                    className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Font</label>
                  <select
                    value={selectedElement.fontFamily}
                    onChange={(e) => onUpdateElement(selectedElement.id, { fontFamily: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-600 transition-colors cursor-pointer"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Bebas Neue">Bebas Neue</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Style</label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onUpdateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm transition-all duration-200 ${selectedElement.fontWeight === 'bold' ? 'bg-white text-black' : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}
                    >
                      <Bold className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => onUpdateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm transition-all duration-200 ${selectedElement.fontStyle === 'italic' ? 'bg-white text-black' : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}
                    >
                      <Italic className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Alignment</label>
                  <div className="flex gap-1.5">
                    {['left', 'center', 'right'].map(align => (
                      <button
                        key={align}
                        onClick={() => onUpdateElement(selectedElement.id, { align })}
                        className={`flex-1 py-2.5 rounded-lg text-sm transition-all duration-200 ${selectedElement.align === align ? 'bg-white text-black' : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:border-zinc-700'}`}
                      >
                        {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                        {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                        {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Color</label>
                  <input
                    type="color"
                    value={selectedElement.color}
                    onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })}
                    className="w-full h-9 rounded-lg cursor-pointer border border-zinc-800 bg-zinc-900"
                  />
                </div>

                {/* Inline Link Section */}
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Link2 className="w-3 h-3" /> Links
                  </label>

                  <p className="text-[10px] text-zinc-600 italic mb-2">
                    Double-click to edit, select text, then use the floating toolbar to add links
                  </p>

                  {/* Show existing links */}
                  {selectedElement.links && selectedElement.links.length > 0 && (
                    <div className="space-y-1">
                      {selectedElement.links.map((link, i) => (
                        <div key={i} className="flex items-center gap-1 p-1.5 bg-zinc-900/50 rounded text-[10px]">
                          <span className="text-blue-400 flex-1 truncate" title={link.url}>
                            "{selectedElement.content.substring(link.start, link.end)}"
                          </span>
                          <button
                            onClick={() => {
                              const newLinks = selectedElement.links.filter((_, idx) => idx !== i);
                              onUpdateElement(selectedElement.id, { links: newLinks });
                            }}
                            className="p-0.5 hover:bg-red-600/20 rounded text-zinc-500 hover:text-red-400 transition-colors"
                            title="Remove link"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedElement.type === 'image' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Style</label>
                  <select
                    value={selectedElement.frameStyle || 'none'}
                    onChange={(e) => onUpdateElement(selectedElement.id, { frameStyle: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-zinc-600 transition-colors cursor-pointer"
                  >
                    <optgroup label="Corners">
                      <option value="none">Sharp (Default)</option>
                      <option value="rounded-sm">Rounded Small</option>
                      <option value="rounded-md">Rounded Medium</option>
                      <option value="rounded-lg">Rounded Large</option>
                      <option value="rounded-full">Circle / Pill</option>
                    </optgroup>
                    <optgroup label="Borders">
                      <option value="border-thin">Subtle Border</option>
                      <option value="border-white">White Border</option>
                      <option value="validate">VALIDATE Accent</option>
                    </optgroup>
                    <optgroup label="Effects">
                      <option value="shadow">Drop Shadow</option>
                      <option value="shadow-glow">Soft Glow</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Opacity</label>
                    <span className="text-[10px] text-zinc-400 font-mono">{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((selectedElement.opacity ?? 1) * 100)}
                    onChange={(e) => onUpdateElement(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })}
                    className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-zinc-200"
                  />
                </div>
                <button
                  onClick={() => onOpenCropper && onOpenCropper(selectedElement)}
                  className="w-full px-3 py-2.5 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-lg text-white text-sm flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <Crop className="w-3.5 h-3.5 text-zinc-400" /> Crop & Reposition
                </button>
                <p className="text-[10px] text-zinc-600 text-center">Double-click image to crop</p>

                {/* Video Attachment Section */}
                <div className="mt-4 pt-4 border-t border-zinc-800/50">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Video className="w-3 h-3" /> Video (Optional)
                  </label>
                  {selectedElement.videoSrc ? (
                    <div className="space-y-2">
                      <div className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          <span className="text-xs text-zinc-300 truncate flex-1">
                            {selectedElement.videoSrc.split('/').pop()}
                          </span>
                          <button
                            onClick={() => onUpdateElement(selectedElement.id, { videoSrc: null })}
                            className="p-1 hover:bg-red-600/20 rounded text-zinc-500 hover:text-red-400 transition-colors"
                            title="Remove video"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-600 text-center">
                        Video plays on web links. PDF shows the image.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={onAttachVideo}
                        className="w-full px-3 py-2.5 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-lg text-white text-sm flex items-center justify-center gap-2 transition-all duration-200"
                      >
                        <Video className="w-3.5 h-3.5 text-zinc-400" /> Attach Video
                      </button>
                      <p className="text-[10px] text-zinc-600 text-center">
                        Video loops on web. PDF shows image as fallback.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedElement.type === 'shape' && (
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Color</label>
                <input
                  type="color"
                  value={selectedElement.color}
                  onChange={(e) => onUpdateElement(selectedElement.id, { color: e.target.value })}
                  className="w-full h-9 rounded-lg cursor-pointer border border-zinc-800 bg-zinc-900"
                />
              </div>
            )}

            {selectedElement.type === 'video' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5 block">Video URL</label>
                  <input
                    type="text"
                    value={selectedElement.videoUrl || ''}
                    onChange={(e) => onUpdateElement(selectedElement.id, { videoUrl: e.target.value })}
                    placeholder="YouTube or Vimeo URL"
                    className="w-full px-3 py-2 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-zinc-600 text-center">Supports YouTube and Vimeo links</p>

                {/* PDF Thumbnail status */}
                {selectedElement.pdfThumbnail && (
                  <div className="pt-3 border-t border-zinc-800/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-green-500 flex items-center gap-1.5">
                        <FileDown className="w-3 h-3" /> PDF thumbnail set
                      </span>
                      <button
                        onClick={() => onUpdateElement(selectedElement.id, { pdfThumbnail: null })}
                        className="text-[10px] text-zinc-500 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Position & Size */}
            <div className="mt-5 pt-4 border-t border-zinc-800/50">
              {selectedElement.type === 'video' ? (
                /* Simple controls for video - just center button and size */
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      const newX = (900 - selectedElement.width) / 2;
                      const newY = (506 - selectedElement.height) / 2;
                      onUpdateElement(selectedElement.id, { x: newX, y: newY });
                    }}
                    className="w-full py-2.5 px-3 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg text-white text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                    Center on Slide
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-600 font-mono block mb-1">Width</span>
                      <input 
                        type="number" 
                        value={Math.round(selectedElement.width)} 
                        onChange={(e) => onUpdateElement(selectedElement.id, { width: parseInt(e.target.value) || 200 })} 
                        className="w-full px-2.5 py-1.5 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600 transition-colors" 
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-600 font-mono block mb-1">Height</span>
                      <input 
                        type="number" 
                        value={Math.round(selectedElement.height)} 
                        onChange={(e) => onUpdateElement(selectedElement.id, { height: parseInt(e.target.value) || 150 })} 
                        className="w-full px-2.5 py-1.5 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600 transition-colors" 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Full controls for other elements */
                <>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3 block">Position & Size</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-600 font-mono block mb-1">X</span>
                      <input type="number" value={Math.round(selectedElement.x)} onChange={(e) => onUpdateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })} className="w-full px-2.5 py-1.5 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600 transition-colors" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-600 font-mono block mb-1">Y</span>
                      <input type="number" value={Math.round(selectedElement.y)} onChange={(e) => onUpdateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })} className="w-full px-2.5 py-1.5 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600 transition-colors" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-600 font-mono block mb-1">W</span>
                      <input type="number" value={Math.round(selectedElement.width)} onChange={(e) => onUpdateElement(selectedElement.id, { width: parseInt(e.target.value) || 50 })} className="w-full px-2.5 py-1.5 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600 transition-colors" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-600 font-mono block mb-1">H</span>
                      <input type="number" value={Math.round(selectedElement.height)} onChange={(e) => onUpdateElement(selectedElement.id, { height: parseInt(e.target.value) || 20 })} className="w-full px-2.5 py-1.5 bg-zinc-900/80 border border-zinc-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-zinc-600 transition-colors" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={() => onDeleteElement(selectedElement.id)}
              className="w-full mt-5 py-2.5 px-3 bg-zinc-900/40 hover:bg-[#C41E3A]/10 border border-zinc-800/50 hover:border-[#C41E3A]/30 rounded-lg text-zinc-400 hover:text-[#C41E3A] text-xs flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Element
            </button>
          </div>
        )}

        {!selectedElement && (
          <div className="py-8 text-center">
            <div className="w-8 h-8 mx-auto mb-3 rounded-full bg-zinc-900/60 border border-zinc-800 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-zinc-600" />
            </div>
            <p className="text-[11px] text-zinc-600">Click an element to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
// FORMATTED MESSAGE (for AI responses)
// ============================================
// EXPIRATION MODAL
function FormattedMessage({ text }) {
  // Split by double newlines for paragraphs, or single newlines
  const lines = text.split(/\n+/).filter(line => line.trim());
  
  const formatLine = (line) => {
    // Handle bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-medium">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };
  
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-zinc-500">•</span>
              <span>{formatLine(trimmed.slice(2))}</span>
            </div>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          const num = trimmed.match(/^(\d+)\./)[1];
          const content = trimmed.replace(/^\d+\.\s*/, '');
          return (
            <div key={i} className="flex gap-2">
              <span className="text-zinc-500 min-w-[1.25rem]">{num}.</span>
              <span>{formatLine(content)}</span>
            </div>
          );
        }
        // Regular paragraph
        return <p key={i}>{formatLine(trimmed)}</p>;
      })}
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
// CHAT PANEL
// ============================================
// EXPIRATION MODAL
function ChatPanel({ messages, onSend, onClearChat, isRefining, isMobile }) {
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isRefining]);
  
  // Auto-expand when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setExpanded(true);
    }
  }, [messages.length]);

  const handleSend = (text = message) => {
    if (!text.trim() || isRefining) return;
    setMessage('');
    setExpanded(true);
    onSend(text.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMobile) {
    return (
      <div className="bg-black border-t border-zinc-800/50 p-3">
        {(messages.length > 0 || isRefining) && (
          <div className="mb-3 max-h-40 overflow-y-auto space-y-2">
            {messages.slice(-4).map((msg) => (
              <div key={msg.id} className={`px-3 py-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-zinc-800 text-white ml-8' : 'bg-zinc-900/80 text-zinc-300 mr-8 border border-zinc-800/50'}`}>
                {msg.role === 'user' ? msg.content : <FormattedMessage text={msg.content} />}
              </div>
            ))}
            {isRefining && (
              <div className="px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800/50 mr-8 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#C41E3A] animate-spin" />
                <span className="text-sm text-zinc-500">Thinking...</span>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for changes..."
            className="flex-1 px-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-600 focus:border-zinc-700 focus:outline-none transition-colors"
          />
          {isRefining ? (
            <div className="p-2.5"><RefreshCw className="w-5 h-5 text-[#C41E3A] animate-spin" /></div>
          ) : (
            <button onClick={() => handleSend()} disabled={!message.trim()} className="p-2.5 bg-white rounded-lg disabled:opacity-40 hover:shadow-[0_4px_12px_rgba(255,255,255,0.1)] transition-all">
              <Send className="w-5 h-5 text-black" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Desktop - expandable chat panel
  return (
    <div className={`bg-black border-t border-zinc-800/50 transition-all duration-300 ease-out flex flex-col ${expanded ? 'h-80' : 'h-20'}`}>
      {/* Expanded: Header with collapse button */}
      {expanded && (
        <div className="flex items-center justify-between px-6 py-2 border-b border-zinc-900/50 flex-shrink-0">
          <span className="font-display text-sm text-white tracking-[0.1em] flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-[#C41E3A]" />
            CHAT
          </span>
          <div className="flex items-center gap-3">
            {messages.length > 0 && onClearChat && (
              <button
                onClick={onClearChat}
                className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 uppercase tracking-wider transition-colors"
              >
                Clear
              </button>
            )}
            {isRefining && <RefreshCw className="w-4 h-4 text-[#C41E3A] animate-spin" />}
            <button
              onClick={() => { setExpanded(false); }}
              className="p-1.5 hover:bg-zinc-900 rounded-lg transition-colors"
              title="Collapse chat"
            >
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>
      )}

      {/* Expanded: Messages area (scrollable) */}
      {expanded && (
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3 scrollbar-dark min-h-0">
          {messages.length === 0 ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-zinc-900/60 border border-zinc-800 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-zinc-600" />
              </div>
              <p className="text-zinc-600 text-sm mb-3">Ask me to modify your slides</p>
              {/* Chat starter suggestions */}
              <div className="flex flex-wrap justify-center gap-1.5 max-w-md mx-auto">
                {[
                  "Review as a sales expert",
                  "Think like the client",
                  "Make it more concise",
                  "Strengthen the value prop",
                  "Add more urgency"
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setMessage(suggestion);
                      setTimeout(() => handleSend(suggestion), 100);
                    }}
                    className="px-2.5 py-1 text-[10px] bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-full text-zinc-500 hover:text-zinc-300 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-3 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-white text-black max-w-sm'
                      : 'bg-zinc-900/80 text-zinc-300 border border-zinc-800/50 max-w-lg'
                  }`}>
                    {msg.role === 'user' ? msg.content : <FormattedMessage text={msg.content} />}
                  </div>
                </div>
              ))}
              {isRefining && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800/50 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#C41E3A] animate-spin" />
                    <span className="text-sm text-zinc-500">Thinking...</span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input area - always visible */}
      <div className={`px-6 py-3 flex items-center gap-3 flex-shrink-0 ${expanded ? 'border-t border-zinc-900/50' : ''}`}>
        {!expanded && (
          <>
            <button
              onClick={() => setExpanded(true)}
              className="font-display text-sm text-zinc-500 hover:text-zinc-300 flex-shrink-0 flex items-center gap-2 tracking-[0.1em] transition-colors"
            >
              <Sparkles className="w-3 h-3 text-[#C41E3A]" />
              CHAT
              {messages.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] flex items-center justify-center text-zinc-400 font-mono">
                  {messages.length}
                </span>
              )}
            </button>
          </>
        )}
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setExpanded(true)}
          placeholder={expanded ? "Type a message..." : "Ask me to modify your slides..."}
          className="flex-1 px-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg text-white text-sm placeholder-zinc-600 focus:border-zinc-700 focus:outline-none transition-colors"
        />
        <button
          onClick={() => handleSend()}
          disabled={!message.trim() || isRefining}
          className="px-4 py-2.5 bg-white hover:bg-zinc-100 rounded-lg disabled:opacity-40 transition-all flex-shrink-0 hover:shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
        >
          <Send className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
// SUPABASE CONFIGURATION
// ============================================
// EXPIRATION MODAL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;
const STORAGE_BUCKET = 'validate-images';
const PROJECTS_BUCKET = 'validate-projects';

// Supabase headers for API calls
const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`
};

// ============================================
// EXPIRATION MODAL
// PROJECT STORAGE (via API route to avoid CORS)
// ============================================
// EXPIRATION MODAL
const projectStorage = {
  // Load clients index
  async loadClientsIndex() {
    try {
      const response = await fetch(`/api/storage?path=clients-index.json`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (e) {
      console.error('Failed to load clients index:', e);
      return null;
    }
  },

  // Save clients index
  async saveClientsIndex(clients) {
    try {
      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'clients-index.json', data: clients })
      });
      const result = await response.json();
      if (!response.ok) {
        console.error('Failed to save clients index:', result.error);
      }
      return response.ok;
    } catch (e) {
      console.error('Failed to save clients index:', e);
      return false;
    }
  },

  // Load a project (via API route)
  async loadProject(projectId) {
    try {
      const response = await fetch(`/api/storage?path=projects/${projectId}.json`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.error('Failed to load project:', e);
      return null;
    }
  },

  // Save a project (via API route)
  async saveProject(projectId, data) {
    try {
      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `projects/${projectId}.json`, data })
      });
      if (!response.ok) {
        const result = await response.json();
        console.error('Failed to save project:', result.error);
      }
      return response.ok;
    } catch (e) {
      console.error('Failed to save project:', e);
      return false;
    }
  },

  // Delete a project
  async deleteProject(projectId) {
    try {
      const response = await fetch(`/api/storage?path=projects/${projectId}.json`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (e) {
      console.error('Failed to delete project:', e);
      return false;
    }
  },

  // Save image folders metadata
  async saveFolders(folders) {
    try {
      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'image-folders.json', data: folders })
      });
      return response.ok;
    } catch (e) {
      console.error('Failed to save folders:', e);
      return false;
    }
  },

  // Load image folders metadata
  async loadFolders() {
    try {
      const response = await fetch(`/api/storage?path=image-folders.json`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.error('Failed to load folders:', e);
      return null;
    }
  },

  // Save image metadata
  async saveImageMeta(meta) {
    try {
      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'image-meta.json', data: meta })
      });
      if (!response.ok) {
        const result = await response.json();
        console.error('Failed to save image meta:', result.error);
      }
      return response.ok;
    } catch (e) {
      console.error('Failed to save image meta:', e);
      return false;
    }
  },

  // Load image metadata
  async loadImageMeta() {
    try {
      const response = await fetch(`/api/storage?path=image-meta.json`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.error('Failed to load image meta:', e);
      return null;
    }
  },

  // Save deleted projects
  async saveDeletedProjects(deletedProjects) {
    try {
      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'deleted-projects.json', data: deletedProjects })
      });
      return response.ok;
    } catch (e) {
      console.error('Failed to save deleted projects:', e);
      return false;
    }
  },

  // Load deleted projects
  async loadDeletedProjects() {
    try {
      const response = await fetch(`/api/storage?path=deleted-projects.json`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (e) {
      console.error('Failed to load deleted projects:', e);
      return [];
    }
  }
};

// ============================================
// EXPIRATION MODAL
// IMAGE LIBRARY (Supabase Storage)
// ============================================
// EXPIRATION MODAL

function ImageLibrary({ isOpen, onClose, onSelectImage, onLibraryLoaded, filterVideosOnly = false }) {
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [draggedImage, setDraggedImage] = useState(null);
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [storageError, setStorageError] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const fileInputRef = useRef(null);

  // Special folder ID for trash
  const TRASH_FOLDER_ID = '__trash__';

  // Supabase helpers
  const supabaseHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  };

  const getPublicUrl = (path) => 
    `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;

  // Load from Supabase on open
  useEffect(() => {
    if (isOpen) {
      loadLibrary();
    }
  }, [isOpen]);

  const loadLibrary = async () => {
    setIsLoading(true);
    setStorageError(null);

    try {
      // Load folders from Supabase only (cloud storage - syncs across all computers)
      let loadedFolders = [];
      try {
        const foldersResponse = await fetch('/api/storage?path=image-folders.json');
        if (foldersResponse.ok) {
          const cloudFolders = await foldersResponse.json();
          if (cloudFolders && Array.isArray(cloudFolders) && cloudFolders.length > 0) {
            loadedFolders = cloudFolders;
          }
        }
      } catch (e) {
        console.error('Failed to load folders from cloud:', e);
      }

      setFolders(loadedFolders);

      // List files from Supabase via API route (root level)
      const response = await fetch('/api/storage/upload?prefix=');

      if (!response.ok) {
        const result = await response.json();
        console.error('List error:', response.status, result.error);
        setStorageError(`List error (${response.status}): ${result.error?.substring(0, 80) || 'Unknown error'}`);
        setIsLoading(false);
        return;
      }

      let files = await response.json();

      // Also list files from videos/ subfolder
      try {
        const videosResponse = await fetch('/api/storage/upload?prefix=videos/');
        if (videosResponse.ok) {
          const videoFiles = await videosResponse.json();
          // Add videos/ prefix to file names for proper path
          const videosWithPath = videoFiles.map(f => ({
            ...f,
            name: f.name ? `videos/${f.name}` : f.name
          }));
          files = [...files, ...videosWithPath];
        }
      } catch (e) {
        console.error('Failed to list videos folder:', e);
      }

      // Load metadata from Supabase only (cloud storage - syncs across all computers)
      let metadata = {};
      try {
        const metaResponse = await fetch('/api/storage?path=image-meta.json');
        if (metaResponse.ok) {
          const cloudMeta = await metaResponse.json();
          if (cloudMeta && typeof cloudMeta === 'object' && Object.keys(cloudMeta).length > 0) {
            metadata = cloudMeta;
          }
        }
      } catch (e) {
        console.error('Failed to load metadata from cloud:', e);
      }

      // Video file extensions for fallback detection
      const videoExtensions = ['.mp4', '.webm', '.mov', '.m4v', '.avi'];

      // Map to image objects
      const loadedImages = files
        .filter(f => f.name && !f.name.endsWith('/') && f.name !== '.emptyFolderPlaceholder')
        .map(f => {
          // Detect video by metadata flag OR file extension (fallback for older uploads)
          const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
          const isVideoByExt = videoExtensions.includes(ext);
          const isVideo = metadata[f.name]?.isVideo || isVideoByExt;

          return {
            id: f.name,
            name: metadata[f.name]?.displayName || f.name,
            folderId: metadata[f.name]?.folderId || null,
            path: f.name,
            url: getPublicUrl(f.name),
            thumbnail: getPublicUrl(f.name),
            createdAt: f.created_at || new Date().toISOString(),
            size: f.metadata?.size || 0,
            isVideo: isVideo  // Restore video flag
          };
        });

      setImages(loadedImages);
      // Notify parent of loaded library data for AI chat access
      if (onLibraryLoaded) {
        onLibraryLoaded(loadedImages, loadedFolders || []);
      }
    } catch (e) {
      console.error('Load error:', e);
      setStorageError(`Network error: ${e.message}`);
    }
    setIsLoading(false);
  };

  const saveFolders = async (newFolders) => {
    setFolders(newFolders);
    // Save to Supabase only
    try {
      await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'image-folders.json', data: newFolders })
      });
    } catch (e) {
      console.error('Failed to save folders to cloud:', e);
    }
  };

  const saveMetadata = async (imgs) => {
    const meta = {};
    imgs.forEach(img => {
      meta[img.path] = {
        displayName: img.name,
        folderId: img.folderId,
        isVideo: img.isVideo || false  // Save video flag
      };
    });
    // Save to Supabase only
    try {
      await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'image-meta.json', data: meta })
      });
    } catch (e) {
      console.error('Failed to save metadata to cloud:', e);
    }
  };

  // Generate image using Gemini API
  const generateImage = async () => {
    if (!generatePrompt.trim()) return;

    setIsGeneratingImage(true);
    setGenerateError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: generatePrompt,
          aspectRatio: '16:9',
          size: '1K'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (!data.image) {
        throw new Error('No image returned');
      }

      // Convert base64 to blob and upload to Supabase
      const byteCharacters = atob(data.image.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.image.mimeType });

      // Generate filename
      const ext = data.image.mimeType.split('/')[1] || 'png';
      const filename = `generated-${Date.now()}.${ext}`;

      // Upload to Supabase
      const uploadResponse = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filename}`,
        {
          method: 'POST',
          headers: {
            ...supabaseHeaders,
            'Content-Type': data.image.mimeType
          },
          body: blob
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload generated image');
      }

      // Add to images list
      const newImage = {
        id: filename,
        name: generatePrompt.slice(0, 50) + (generatePrompt.length > 50 ? '...' : ''),
        folderId: currentFolder,
        path: filename,
        url: getPublicUrl(filename),
        thumbnail: getPublicUrl(filename),
        createdAt: new Date().toISOString(),
        size: blob.size,
        generated: true
      };

      const updated = [newImage, ...images];
      setImages(updated);
      // Close modal and reset first for better UX
      setShowGenerateModal(false);
      setGeneratePrompt('');
      saveMetadata(updated);
    } catch (err) {
      console.error('Generate error:', err);
      setGenerateError(err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      parentId: currentFolder,
      createdAt: new Date().toISOString()
    };
    setNewFolderName('');
    setShowNewFolder(false);
    saveFolders([...folders, newFolder]);
  };

  const renameFolder = async (folderId, newName) => {
    const updated = folders.map(f => f.id === folderId ? { ...f, name: newName } : f);
    setEditingFolder(null);
    saveFolders(updated);
  };

  const deleteFolder = async (folderId) => {
    const folderIds = [folderId];
    const getSubfolders = (parentId) => {
      folders.forEach(f => {
        if (f.parentId === parentId) {
          folderIds.push(f.id);
          getSubfolders(f.id);
        }
      });
    };
    getSubfolders(folderId);
    
    // Delete images in folders from Supabase
    const toDelete = images.filter(img => folderIds.includes(img.folderId));
    for (const img of toDelete) {
      await deleteFromSupabase(img.path);
    }
    
    const updatedFolders = folders.filter(f => !folderIds.includes(f.id));
    const updatedImages = images.filter(img => !folderIds.includes(img.folderId));

    setImages(updatedImages);
    if (currentFolder === folderId) setCurrentFolder(null);

    // Save both (now synchronous)
    saveFolders(updatedFolders);
    saveMetadata(updatedImages);
  };

  const deleteFromSupabase = async (path) => {
    try {
      await fetch(`/api/storage/upload?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Delete failed:', path);
    }
  };

  // Max file size: 200MB
  const MAX_FILE_SIZE = 200 * 1024 * 1024;

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);
    setStorageError(null);
    const newImages = [];

    // Supported file types
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    for (const file of files) {
      const isImage = imageTypes.includes(file.type) || file.type.startsWith('image/');
      const isVideo = videoTypes.includes(file.type);

      if (!isImage && !isVideo) continue;

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = Math.round(file.size / 1024 / 1024);
        setStorageError(`File "${file.name}" is too large (${sizeMB}MB). Maximum size is 200MB.`);
        continue;
      }

      try {
        const ext = file.name.split('.').pop();
        // Store videos in a videos/ subfolder for organization
        const prefix = isVideo ? 'videos/' : '';
        const filename = `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

        // Upload via API route (uses service_role key server-side)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename', filename);

        const response = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
          newImages.push({
            id: filename,
            name: file.name,
            folderId: currentFolder,
            path: filename,
            url: getPublicUrl(filename),
            thumbnail: getPublicUrl(filename),
            createdAt: new Date().toISOString(),
            size: file.size,
            isVideo: isVideo  // Flag to identify videos
          });
        } else {
          console.error('Upload failed:', response.status, result.error);
          // Better error message for payload too large
          if (response.status === 413 || (result.error && result.error.includes('Payload too large'))) {
            setStorageError(`File too large. Please increase the upload limit in Supabase Dashboard → Storage → Settings.`);
          } else {
            setStorageError(`Upload failed: ${result.error?.substring(0, 100) || 'Unknown error'}`);
          }
        }
      } catch (err) {
        console.error('Upload error:', err);
        setStorageError(`Network error: ${err.message}`);
      }
    }

    if (newImages.length > 0) {
      const updated = [...images, ...newImages];
      setImages(updated);
      saveMetadata(updated);
    }

    setIsUploading(false);
    e.target.value = '';
  };

  const renameImage = async (imageId, newName) => {
    const updated = images.map(img => img.id === imageId ? { ...img, name: newName } : img);
    setImages(updated);
    setEditingImage(null);
    saveMetadata(updated);
  };

  // Move image to trash (soft delete)
  const deleteImage = async (imageId) => {
    const updated = images.map(img =>
      img.id === imageId ? { ...img, folderId: TRASH_FOLDER_ID, previousFolderId: img.folderId } : img
    );
    setImages(updated);
    setSelectedImages(prev => prev.filter(id => id !== imageId));
    saveMetadata(updated);
  };

  // Move selected images to trash (soft delete)
  const deleteSelectedImages = async () => {
    const updated = images.map(img =>
      selectedImages.includes(img.id)
        ? { ...img, folderId: TRASH_FOLDER_ID, previousFolderId: img.folderId }
        : img
    );
    setImages(updated);
    setSelectedImages([]);
    saveMetadata(updated);
  };

  // Permanently delete image from Supabase
  const permanentlyDeleteImage = async (imageId) => {
    const img = images.find(i => i.id === imageId);
    if (img) await deleteFromSupabase(img.path);
    const updated = images.filter(img => img.id !== imageId);
    setImages(updated);
    setSelectedImages(prev => prev.filter(id => id !== imageId));
    saveMetadata(updated);
  };

  // Permanently delete all images in trash
  const emptyTrash = async () => {
    const trashImages = images.filter(img => img.folderId === TRASH_FOLDER_ID);
    for (const img of trashImages) {
      await deleteFromSupabase(img.path);
    }
    const updated = images.filter(img => img.folderId !== TRASH_FOLDER_ID);
    setImages(updated);
    setSelectedImages([]);
    saveMetadata(updated);
  };

  // Restore image from trash
  const restoreImage = async (imageId) => {
    const updated = images.map(img =>
      img.id === imageId ? { ...img, folderId: img.previousFolderId || null, previousFolderId: undefined } : img
    );
    setImages(updated);
    saveMetadata(updated);
  };

  // Restore selected images from trash
  const restoreSelectedImages = async () => {
    const updated = images.map(img =>
      selectedImages.includes(img.id)
        ? { ...img, folderId: img.previousFolderId || null, previousFolderId: undefined }
        : img
    );
    setImages(updated);
    setSelectedImages([]);
    saveMetadata(updated);
  };

  const moveImages = async (imageIds, targetFolderId) => {
    const updated = images.map(img =>
      imageIds.includes(img.id) ? { ...img, folderId: targetFolderId } : img
    );
    setImages(updated);
    setSelectedImages([]);
    saveMetadata(updated);
  };

  const downloadImage = async (image) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.name;
    link.target = '_blank';
    link.click();
  };

  const handleDragStart = (e, image) => {
    setDraggedImage(image);
    e.dataTransfer.setData('text/plain', image.id);
    e.dataTransfer.effectAllowed = 'move';
    window.__draggedLibraryImage = image.url;
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
    setDragOverFolder(null);
  };

  const handleFolderDragOver = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolder !== folderId) {
      setDragOverFolder(folderId);
    }
  };

  const handleFolderDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);
  };

  const handleFolderDrop = (e, targetFolderId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);

    if (draggedImage) {
      // If we have selected images and the dragged image is one of them, move all selected
      const imagesToMove = selectedImages.includes(draggedImage.id) && selectedImages.length > 1
        ? selectedImages
        : [draggedImage.id];

      moveImages(imagesToMove, targetFolderId);
      setDraggedImage(null);
    }
  };

  const handleImageClick = (image, e) => {
    if (e.shiftKey && selectedImages.length > 0) {
      const currentImages = filteredImages;
      const lastSelectedIndex = currentImages.findIndex(img => img.id === selectedImages[selectedImages.length - 1]);
      const clickedIndex = currentImages.findIndex(img => img.id === image.id);
      const start = Math.min(lastSelectedIndex, clickedIndex);
      const end = Math.max(lastSelectedIndex, clickedIndex);
      const rangeIds = currentImages.slice(start, end + 1).map(img => img.id);
      setSelectedImages(prev => [...new Set([...prev, ...rangeIds])]);
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedImages(prev => 
        prev.includes(image.id) ? prev.filter(id => id !== image.id) : [...prev, image.id]
      );
    } else {
      setSelectedImages([image.id]);
    }
  };

  const handleImageDoubleClick = (image) => {
    // Prevent inserting videos directly as elements (they need to be attached to images)
    if (image.isVideo && !filterVideosOnly) {
      setStorageError('Videos cannot be inserted directly. First add an image to your slide, then use "Attach Video" in the properties panel.');
      return;
    }
    onSelectImage(image.url, image);  // Pass full asset object
    onClose(); // Explicit close as safety net
  };

  const handleAddToSlide = (image) => {
    // Prevent inserting videos directly as elements (they need to be attached to images)
    if (image.isVideo && !filterVideosOnly) {
      setStorageError('Videos cannot be inserted directly. First add an image to your slide, then use "Attach Video" in the properties panel.');
      return;
    }
    onSelectImage(image.url, image);  // Pass full asset object
    onClose(); // Explicit close as safety net
  };

  const handleContextMenu = (e, image) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, image });
  };

  const filteredImages = images.filter(img => {
    const inFolder = img.folderId === currentFolder;
    const matchesSearch = !searchQuery || img.name.toLowerCase().includes(searchQuery.toLowerCase());
    // When filterVideosOnly is true, only show videos
    const matchesFilter = !filterVideosOnly || img.isVideo;
    return inFolder && matchesSearch && matchesFilter;
  });

  // Count of items in trash
  const trashCount = images.filter(img => img.folderId === TRASH_FOLDER_ID).length;
  const isInTrash = currentFolder === TRASH_FOLDER_ID;

  const subfolders = folders.filter(f => f.parentId === currentFolder);

  const getBreadcrumbs = () => {
    // Handle trash folder specially
    if (currentFolder === TRASH_FOLDER_ID) {
      return [{ id: null, name: 'Library' }, { id: TRASH_FOLDER_ID, name: 'Recently Deleted' }];
    }
    const path = [{ id: null, name: 'Library' }];
    let current = currentFolder;
    while (current) {
      const folder = folders.find(f => f.id === current);
      if (folder) {
        path.splice(1, 0, folder);
        current = folder.parentId;
      } else {
        break;
      }
    }
    return path;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-zinc-900 rounded-lg w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-zinc-400" />
            <h2 className="font-display text-xl text-white">IMAGE LIBRARY</h2>
          </div>
          <div className="flex items-center gap-3">
            {selectedImages.length > 0 && (
              <span className="text-sm text-zinc-400">{selectedImages.length} selected</span>
            )}
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-zinc-800">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 flex-1">
            {getBreadcrumbs().map((crumb, i, arr) => (
              <React.Fragment key={crumb.id || 'root'}>
                <button
                  onClick={() => setCurrentFolder(crumb.id)}
                  onDragOver={(e) => {
                    if (draggedImage && crumb.id !== currentFolder) {
                      handleFolderDragOver(e, crumb.id);
                    }
                  }}
                  onDragLeave={handleFolderDragLeave}
                  onDrop={(e) => {
                    if (draggedImage && crumb.id !== currentFolder) {
                      handleFolderDrop(e, crumb.id);
                    }
                  }}
                  className={`text-sm px-2 py-1 rounded transition-all ${
                    dragOverFolder === crumb.id
                      ? 'bg-blue-600/30 text-blue-400 ring-1 ring-blue-500'
                      : crumb.id === currentFolder
                        ? 'text-white'
                        : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {crumb.name}
                </button>
                {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-zinc-600" />}
              </React.Fragment>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search images..."
              className="pl-9 pr-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none w-48"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center border border-zinc-700 rounded overflow-hidden">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`}
            >
              <Grid className="w-4 h-4 text-zinc-400" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`}
            >
              <List className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Actions */}
          {isInTrash ? (
            <button
              onClick={emptyTrash}
              disabled={trashCount === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded text-sm text-white"
            >
              <Trash2 className="w-4 h-4" /> Empty Trash
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowNewFolder(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm text-white"
              >
                <FolderPlus className="w-4 h-4" /> New Folder
              </button>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded text-sm text-white"
              >
                <Sparkles className="w-4 h-4" /> Generate
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-zinc-200 rounded text-sm text-black disabled:opacity-50"
              >
                {isUploading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Upload</>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          )}
        </div>

        {/* Selection Actions */}
        {selectedImages.length > 0 && (
          <div className="flex items-center gap-3 px-6 py-2 bg-zinc-800/50 border-b border-zinc-800">
            {isInTrash ? (
              <>
                <button
                  onClick={restoreSelectedImages}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-zinc-200 rounded text-sm text-black"
                >
                  <RefreshCw className="w-4 h-4" /> Restore
                </button>
                <button
                  onClick={async () => {
                    for (const id of selectedImages) {
                      await permanentlyDeleteImage(id);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm text-white"
                >
                  <Trash2 className="w-4 h-4" /> Delete Forever
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    const image = images.find(img => img.id === selectedImages[0]);
                    if (image) {
                      handleAddToSlide(image);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-zinc-200 rounded text-sm text-black"
                >
                  <Plus className="w-4 h-4" /> Add to Slide
                </button>
                <button
                  onClick={async () => {
                    for (const id of selectedImages) {
                      const img = images.find(i => i.id === id);
                      if (img) await downloadImage(img);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-sm text-white"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={deleteSelectedImages}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-700 hover:bg-red-600 rounded text-sm text-white"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedImages([])}
              className="text-sm text-zinc-400 hover:text-white ml-auto"
            >
              Clear selection
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-6 h-6 text-zinc-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* New Folder Input */}
              {showNewFolder && (
                <div className="flex items-center gap-2 mb-4 p-3 bg-zinc-800 rounded-lg">
                  <Folder className="w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                    placeholder="Folder name..."
                    autoFocus
                    className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none"
                  />
                  <button onClick={createFolder} className="px-3 py-1 bg-white text-black text-sm rounded">Create</button>
                  <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="px-3 py-1 text-zinc-400 text-sm">Cancel</button>
                </div>
              )}

              {/* Folders */}
              {subfolders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Folders</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {subfolders.map(folder => (
                      <div
                        key={folder.id}
                        className={`group relative p-4 rounded-lg cursor-pointer transition-all ${
                          dragOverFolder === folder.id
                            ? 'bg-blue-600/30 ring-2 ring-blue-500 scale-105'
                            : 'bg-zinc-800 hover:bg-zinc-750'
                        }`}
                        onDoubleClick={() => setCurrentFolder(folder.id)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, folder });
                        }}
                        onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                        onDragLeave={handleFolderDragLeave}
                        onDrop={(e) => handleFolderDrop(e, folder.id)}
                      >
                        <Folder className={`w-10 h-10 mx-auto mb-2 transition-colors ${
                          dragOverFolder === folder.id ? 'text-blue-400' : 'text-zinc-500'
                        }`} />
                        {editingFolder === folder.id ? (
                          <input
                            type="text"
                            defaultValue={folder.name}
                            autoFocus
                            onBlur={(e) => renameFolder(folder.id, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && renameFolder(folder.id, e.target.value)}
                            className="w-full bg-zinc-700 text-white text-sm text-center rounded px-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <p className="text-sm text-zinc-300 text-center truncate">{folder.name}</p>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, folder }); }}
                          className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-zinc-700 rounded transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4 text-zinc-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recently Deleted folder - only show at root level */}
              {currentFolder === null && (
                <div className="mb-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    <div
                      className={`group relative p-4 rounded-lg cursor-pointer transition-all ${
                        dragOverFolder === TRASH_FOLDER_ID
                          ? 'bg-red-600/30 ring-2 ring-red-500 scale-105'
                          : 'bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 border-dashed'
                      }`}
                      onDoubleClick={() => setCurrentFolder(TRASH_FOLDER_ID)}
                      onDragOver={(e) => handleFolderDragOver(e, TRASH_FOLDER_ID)}
                      onDragLeave={handleFolderDragLeave}
                      onDrop={(e) => handleFolderDrop(e, TRASH_FOLDER_ID)}
                    >
                      <Trash2 className={`w-10 h-10 mx-auto mb-2 transition-colors ${
                        dragOverFolder === TRASH_FOLDER_ID ? 'text-red-400' : 'text-zinc-600'
                      }`} />
                      <p className="text-sm text-zinc-500 text-center">Recently Deleted</p>
                      {trashCount > 0 && (
                        <p className="text-xs text-zinc-600 text-center mt-1">{trashCount} item{trashCount !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Images */}
              {filteredImages.length > 0 ? (
                <div>
                  <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                    Assets ({filteredImages.length})
                  </h3>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {filteredImages.map(image => (
                        <div
                          key={image.id}
                          className={`group relative aspect-square bg-zinc-800 rounded-lg overflow-hidden cursor-pointer transition-all ${
                            selectedImages.includes(image.id) ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                          }`}
                          onClick={(e) => handleImageClick(image, e)}
                          onDoubleClick={() => handleImageDoubleClick(image)}
                          onContextMenu={(e) => handleContextMenu(e, image)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, image)}
                          onDragEnd={handleDragEnd}
                        >
                          {image.isVideo ? (
                            <video
                              src={image.url}
                              className="w-full h-full object-cover pointer-events-none"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={image.thumbnail || image.url}
                              alt={image.name}
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          )}
                          {/* Video badge */}
                          {image.isVideo && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center">
                              <Play className="w-3 h-3 text-white fill-white" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <p className="text-xs text-white truncate">{image.name}</p>
                            </div>
                          </div>
                          {selectedImages.includes(image.id) && (
                            <div className="absolute top-2 left-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-black" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredImages.map(image => (
                        <div
                          key={image.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedImages.includes(image.id) ? 'bg-zinc-700' : 'hover:bg-zinc-800'
                          }`}
                          onClick={(e) => handleImageClick(image, e)}
                          onDoubleClick={() => handleImageDoubleClick(image)}
                          onContextMenu={(e) => handleContextMenu(e, image)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, image)}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="relative w-10 h-10 flex-shrink-0">
                            {image.isVideo ? (
                              <video
                                src={image.url}
                                className="w-full h-full object-cover rounded pointer-events-none"
                                muted
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={image.thumbnail || image.url}
                                alt={image.name}
                                className="w-full h-full object-cover rounded pointer-events-none"
                              />
                            )}
                            {image.isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white drop-shadow-lg fill-white" />
                              </div>
                            )}
                          </div>
                          {editingImage === image.id ? (
                            <input
                              type="text"
                              defaultValue={image.name}
                              autoFocus
                              onBlur={(e) => renameImage(image.id, e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && renameImage(image.id, e.target.value)}
                              className="flex-1 bg-zinc-700 text-white text-sm rounded px-2 py-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="flex-1 text-sm text-white truncate">{image.name}</span>
                          )}
                          <span className="text-xs text-zinc-500">{formatFileSize(image.size)}</span>
                          <span className="text-xs text-zinc-500">{new Date(image.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ImageIcon className="w-16 h-16 text-zinc-700 mb-4" />
                  <p className="text-zinc-400 mb-2">No assets in this folder</p>
                  <p className="text-sm text-zinc-600 mb-4">Upload images or videos, or drag them here</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 rounded text-sm text-black"
                  >
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
          <span>{images.length} images in library • Double-click or drag to add to slide</span>
          {storageError && (
            <span className="text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {storageError}
            </span>
          )}
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)} />
            <div 
              className="fixed z-50 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 py-1 min-w-[160px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              {contextMenu.folder ? (
                <>
                  <button
                    onClick={() => { setCurrentFolder(contextMenu.folder.id); setContextMenu(null); }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <FolderOpen className="w-4 h-4" /> Open
                  </button>
                  <button
                    onClick={() => { setEditingFolder(contextMenu.folder.id); setContextMenu(null); }}
                    className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" /> Rename
                  </button>
                  <button
                    onClick={() => { deleteFolder(contextMenu.folder.id); setContextMenu(null); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </>
              ) : contextMenu.image ? (
                isInTrash ? (
                  <>
                    <button
                      onClick={() => { restoreImage(contextMenu.image.id); setContextMenu(null); }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Restore
                    </button>
                    <button
                      onClick={async () => { await permanentlyDeleteImage(contextMenu.image.id); setContextMenu(null); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Forever
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { handleAddToSlide(contextMenu.image); setContextMenu(null); }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add to Slide
                    </button>
                    <button
                      onClick={() => { setEditingImage(contextMenu.image.id); setContextMenu(null); }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" /> Rename
                    </button>
                    <button
                      onClick={async () => { await downloadImage(contextMenu.image); setContextMenu(null); }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                    <hr className="border-zinc-700 my-1" />
                    {/* Move to folder submenu */}
                    <div className="relative group/move">
                      <button
                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700 flex items-center gap-2 justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Folder className="w-4 h-4" /> Move to
                        </span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <div className="absolute left-full top-0 ml-1 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 py-1 min-w-[140px] hidden group-hover/move:block">
                        {contextMenu.image.folderId !== null && (
                          <button
                            onClick={() => { moveImages([contextMenu.image.id], null); setContextMenu(null); }}
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700 flex items-center gap-2"
                          >
                            <FolderOpen className="w-4 h-4" /> Library (root)
                          </button>
                        )}
                        {folders.filter(f => f.id !== contextMenu.image.folderId).map(folder => (
                          <button
                            key={folder.id}
                            onClick={() => { moveImages([contextMenu.image.id], folder.id); setContextMenu(null); }}
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-700 flex items-center gap-2"
                          >
                            <Folder className="w-4 h-4" /> {folder.name}
                          </button>
                        ))}
                        {folders.length === 0 && contextMenu.image.folderId === null && (
                          <div className="px-4 py-2 text-sm text-zinc-500">No folders</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => { deleteImage(contextMenu.image.id); setContextMenu(null); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </>
                )
              ) : null}
            </div>
          </>
        )}

        {/* Generate Image Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4" onClick={() => !isGeneratingImage && setShowGenerateModal(false)}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="font-display text-lg text-white">GENERATE IMAGE</h3>
                </div>
                <button
                  onClick={() => !isGeneratingImage && setShowGenerateModal(false)}
                  disabled={isGeneratingImage}
                  className="p-1 hover:bg-zinc-800 rounded disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
                    Describe the image you want to create
                  </label>
                  <textarea
                    value={generatePrompt}
                    onChange={(e) => setGeneratePrompt(e.target.value)}
                    placeholder="A cinematic wide shot of the Ozark mountains at sunset, warm golden light filtering through autumn trees..."
                    className="w-full h-32 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm placeholder-zinc-500 focus:border-purple-500 focus:outline-none resize-none"
                    disabled={isGeneratingImage}
                  />
                </div>

                {generateError && (
                  <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
                    {generateError}
                  </div>
                )}

                <div className="text-xs text-zinc-500">
                  Powered by Gemini 3 Pro (Nano Banana Pro). Images are generated at 16:9 aspect ratio.
                </div>
              </div>

              <div className="p-4 border-t border-zinc-800 flex gap-3">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  disabled={isGeneratingImage}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={generateImage}
                  disabled={!generatePrompt.trim() || isGeneratingImage}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-zinc-700 disabled:to-zinc-700 text-white rounded font-medium flex items-center justify-center gap-2"
                >
                  {isGeneratingImage ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
// IMAGE CROPPER
// ============================================
// EXPIRATION MODAL
function ImageCropper({ element, onSave, onClose }) {
  const [zoom, setZoom] = useState(element?.cropZoom || 1);
  // Position as percentage (0-100), 50 = centered
  const [posX, setPosX] = useState(element?.cropX !== undefined ? element.cropX : 50);
  const [posY, setPosY] = useState(element?.cropY !== undefined ? element.cropY : 50);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, posX: 50, posY: 50 });
  const containerRef = useRef(null);

  if (!element) return null;

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX, 
      y: e.clientY, 
      posX: posX, 
      posY: posY 
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    // Convert pixel movement to percentage (inverted because dragging right should show left part of image)
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100 * -1;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100 * -1;
    
    // Scale the sensitivity based on zoom (higher zoom = more precise control)
    const sensitivity = 1 / zoom;
    
    setPosX(Math.max(0, Math.min(100, dragStart.posX + deltaX * sensitivity)));
    setPosY(Math.max(0, Math.min(100, dragStart.posY + deltaY * sensitivity)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(1, Math.min(3, prev + delta)));
  };

  const handleSave = () => {
    onSave(element.id, {
      cropZoom: zoom,
      cropX: posX,
      cropY: posY
    });
    onClose();
  };

  const handleReset = () => {
    setZoom(1);
    setPosX(50);
    setPosY(50);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-zinc-900 rounded-lg w-full max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="font-display text-lg text-white">CROP & POSITION IMAGE</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Preview Area */}
        <div 
          ref={containerRef}
          className="relative mx-6 my-4 bg-zinc-950 rounded-lg overflow-hidden"
          style={{ 
            width: '100%', 
            maxWidth: 500,
            aspectRatio: `${element.width} / ${element.height}`,
            margin: '1rem auto',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <img
            src={resolveImageSrc(element.src)}
            alt=""
            draggable={false}
            className="w-full h-full select-none"
            style={{
              objectFit: 'cover',
              objectPosition: `${posX}% ${posY}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${posX}% ${posY}%`
            }}
          />
          {/* Grid overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '33.33% 33.33%'
          }} />
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-t border-zinc-800 space-y-4">
          {/* Position Presets */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">Focus</span>
            <div className="grid grid-cols-3 gap-1" style={{ width: 90 }}>
              {[
                { x: 0, y: 0, label: '↖' },
                { x: 50, y: 0, label: '↑' },
                { x: 100, y: 0, label: '↗' },
                { x: 0, y: 50, label: '←' },
                { x: 50, y: 50, label: '●' },
                { x: 100, y: 50, label: '→' },
                { x: 0, y: 100, label: '↙' },
                { x: 50, y: 100, label: '↓' },
                { x: 100, y: 100, label: '↘' },
              ].map(({ x, y, label }) => {
                const isActive = Math.abs(posX - x) < 15 && Math.abs(posY - y) < 15;
                return (
                  <button 
                    key={`${x}-${y}`}
                    onClick={() => { setPosX(x); setPosY(y); }}
                    className={`w-7 h-7 rounded text-xs flex items-center justify-center transition-colors ${isActive ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'}`}
                  >{label}</button>
                );
              })}
            </div>
            <span className="text-xs text-zinc-500 ml-auto">
              {posX === 50 && posY === 50 ? 'Centered' : 
               posY < 33 ? 'Top' : posY > 66 ? 'Bottom' : 'Middle'} 
              {posX < 33 ? ' Left' : posX > 66 ? ' Right' : posX !== 50 ? '' : ''}
            </span>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">Zoom</span>
            <button 
              onClick={() => setZoom(prev => Math.max(1, prev - 0.2))}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded"
            >
              <ZoomOut className="w-4 h-4 text-zinc-400" />
            </button>
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-white"
            />
            <button 
              onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded"
            >
              <ZoomIn className="w-4 h-4 text-zinc-400" />
            </button>
            <span className="text-sm text-white w-12 text-right">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Instructions */}
          <p className="text-xs text-zinc-500">
            Drag image to reposition • Scroll to zoom
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button 
              onClick={handleReset}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Reset
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-white hover:bg-zinc-200 rounded text-sm text-black"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
// PROJECT LIST MODAL
// ============================================
// EXPIRATION MODAL
function ProjectBrowserModal({ clients, currentProjectId, showArchived, onToggleArchived, onLoadProject, onDeleteProject, onDuplicateProject, onArchiveProject, onDeleteClient, onArchiveClient, deletedProjects = [], onRestoreProject, onPermanentlyDeleteProject, onEmptyTrash, onClose, onNew, onNewBlank }) {
  const [expandedClients, setExpandedClients] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showTrash, setShowTrash] = useState(false);
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const toggleClient = (clientId) => {
    setExpandedClients(prev => ({ ...prev, [clientId]: !prev[clientId] }));
  };

  const filteredClients = clients.filter(c => showArchived || !c.archived);
  const activeClients = filteredClients.filter(c => !c.archived);
  const archivedClients = filteredClients.filter(c => c.archived);

  const renderProject = (project, client) => {
    if (!showArchived && project.archived) return null;
    
    return (
      <div 
        key={project.id}
        className={`ml-6 p-3 rounded cursor-pointer transition-colors flex items-center justify-between group ${
          project.id === currentProjectId 
            ? 'bg-zinc-800 border border-zinc-700' 
            : 'hover:bg-zinc-800/50 border border-transparent'
        } ${project.archived ? 'opacity-50' : ''}`}
        onClick={() => onLoadProject(project.id, client.name)}
      >
        <div className="flex-1 min-w-0">
          <h4 className="text-white text-sm truncate">{project.name}</h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
            <span>{formatDate(project.updatedAt)}</span>
            <span>•</span>
            <span>{project.slideCount} slides</span>
            {project.archived && <span className="text-zinc-600">(archived)</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicateProject(client.id, project.id); }}
            className="p-1.5 hover:bg-zinc-700 rounded"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5 text-zinc-400" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onArchiveProject(client.id, project.id); }}
            className="p-1.5 hover:bg-zinc-700 rounded"
            title={project.archived ? 'Unarchive' : 'Archive'}
          >
            {project.archived ? <ArchiveRestore className="w-3.5 h-3.5 text-zinc-400" /> : <Archive className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'project', clientId: client.id, projectId: project.id, name: project.name }); }}
            className="p-1.5 hover:bg-zinc-700 rounded"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>
    );
  };

  const renderClient = (client) => {
    const isExpanded = expandedClients[client.id] !== false; // Default to expanded
    const visibleProjects = showArchived ? client.projects : client.projects.filter(p => !p.archived);
    
    return (
      <div key={client.id} className={`mb-2 ${client.archived ? 'opacity-60' : ''}`}>
        <div 
          className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800/50 cursor-pointer group"
          onClick={() => toggleClient(client.id)}
        >
          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
          <Folder className="w-4 h-4 text-zinc-400" />
          <span className="flex-1 text-white font-medium">{client.name}</span>
          <span className="text-xs text-zinc-500">{visibleProjects.length} proposals</span>
          {client.archived && <span className="text-xs text-zinc-600">(archived)</span>}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onArchiveClient(client.id); }}
              className="p-1 hover:bg-zinc-700 rounded"
              title={client.archived ? 'Unarchive client' : 'Archive client'}
            >
              {client.archived ? <ArchiveRestore className="w-3.5 h-3.5 text-zinc-400" /> : <Archive className="w-3.5 h-3.5 text-zinc-400" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'client', clientId: client.id, name: client.name }); }}
              className="p-1 hover:bg-zinc-700 rounded"
              title="Delete client and all proposals"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="space-y-1 mt-1">
            {visibleProjects.map(project => renderProject(project, client))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 sm:p-0" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-xl h-full sm:h-auto sm:max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-display text-xl text-white">{showTrash ? 'RECENTLY DELETED' : 'PROPOSALS'}</h2>
          <div className="flex items-center gap-2">
            {!showTrash && (
              <button
                onClick={onToggleArchived}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono ${showArchived ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-800'}`}
              >
                {showArchived ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {showArchived ? 'SHOWING ARCHIVED' : 'SHOW ARCHIVED'}
              </button>
            )}
            <button
              onClick={() => setShowTrash(!showTrash)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono ${showTrash ? 'bg-red-900/50 text-red-400' : 'text-zinc-500 hover:bg-zinc-800'}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {showTrash ? 'BACK' : `TRASH${deletedProjects.length > 0 ? ` (${deletedProjects.length})` : ''}`}
            </button>
            <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded"><X className="w-5 h-5 text-zinc-400" /></button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          {showTrash ? (
            // Trash view
            deletedProjects.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Trash is empty</p>
                <p className="text-sm mt-1">Deleted proposals will appear here</p>
              </div>
            ) : (
              <div className="space-y-1">
                {deletedProjects.map(project => (
                  <div
                    key={project.id}
                    className="p-3 rounded hover:bg-zinc-800/50 border border-transparent flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm truncate">{project.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                        <span>{project.clientName}</span>
                        <span>•</span>
                        <span>Deleted {formatDate(project.deletedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onRestoreProject(project.id)}
                        className="px-2.5 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-white flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" /> Restore
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ type: 'permanent', projectId: project.id, name: project.name })}
                        className="px-2.5 py-1.5 bg-red-900/50 hover:bg-red-800 rounded text-xs text-red-400 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3" /> Delete Forever
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Projects view
            filteredClients.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No clients yet</p>
                <p className="text-sm mt-1">Generate your first proposal to get started</p>
              </div>
            ) : (
              <>
                {activeClients.map(renderClient)}
                {showArchived && archivedClients.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 my-4">
                      <div className="flex-1 h-px bg-zinc-800" />
                      <span className="text-xs text-zinc-600 font-mono">ARCHIVED</span>
                      <div className="flex-1 h-px bg-zinc-800" />
                    </div>
                    {archivedClients.map(renderClient)}
                  </>
                )}
              </>
            )
          )}
        </div>
        
        <div className="p-4 border-t border-zinc-800">
          {showTrash ? (
            <button
              onClick={onEmptyTrash}
              disabled={deletedProjects.length === 0}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded font-medium flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Empty Trash
            </button>
          ) : (
            <button onClick={() => { onClose(); onNewBlank(); }} className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black rounded font-medium flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> New Proposal
            </button>
          )}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={() => setConfirmDelete(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-medium mb-2">
              {confirmDelete.type === 'permanent' ? 'Permanently Delete?' : `Delete ${confirmDelete.type === 'client' ? 'Client' : 'Project'}?`}
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              {confirmDelete.type === 'client'
                ? `This will delete "${confirmDelete.name}" and all its proposals.`
                : confirmDelete.type === 'permanent'
                  ? `This will permanently delete "${confirmDelete.name}". This cannot be undone.`
                  : `This will move "${confirmDelete.name}" to the trash.`
              }
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.type === 'client') {
                    onDeleteClient(confirmDelete.clientId);
                  } else if (confirmDelete.type === 'permanent') {
                    onPermanentlyDeleteProject(confirmDelete.projectId);
                  } else {
                    onDeleteProject(confirmDelete.clientId, confirmDelete.projectId);
                  }
                  setConfirmDelete(null);
                }} 
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
// CASE STUDY LIBRARY MODAL
// ============================================
// EXPIRATION MODAL
function CaseStudyLibraryModal({ caseStudies, onInsert, onEdit, onDelete, onDuplicate, onClose, mode = 'browse', editingMode = null }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Can only insert if we're in a proposal
  const canInsert = editingMode === 'proposal';

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-display text-xl text-white">CASE STUDIES</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {caseStudies.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No case studies yet</p>
              <p className="text-xs text-zinc-600 mt-1">Generate a case study from the homepage</p>
            </div>
          ) : (
            <div className="space-y-2">
              {caseStudies.map((cs) => (
                <div
                  key={cs.id}
                  onClick={() => onEdit(cs.id)}
                  className="p-3 rounded bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/70 transition-colors group cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{cs.name}</h4>
                      {cs.clientName && (
                        <p className="text-xs text-zinc-500 mt-0.5">{cs.clientName}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                        <span>{formatDate(cs.updatedAt || cs.createdAt)}</span>
                        <span>•</span>
                        <span>{cs.slideCount} slides</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                      {canInsert && (
                        <button
                          onClick={() => onInsert(cs.id)}
                          className="px-3 py-1.5 bg-white text-black rounded text-xs font-display tracking-wider hover:bg-zinc-200 transition-colors mr-1"
                        >
                          INSERT
                        </button>
                      )}
                      <button
                        onClick={() => onDuplicate(cs.id)}
                        className="p-1.5 hover:bg-zinc-700 rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4 text-zinc-400" />
                      </button>
                      <button
                        onClick={() => onEdit(cs.id)}
                        className="p-1.5 hover:bg-zinc-700 rounded"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4 text-zinc-400" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(cs)}
                        className="p-1.5 hover:bg-zinc-700 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Delete Dialog */}
        {confirmDelete && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 rounded-lg">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 max-w-sm w-full">
              <h3 className="text-white font-display mb-2">DELETE CASE STUDY?</h3>
              <p className="text-sm text-zinc-400 mb-4">
                "{confirmDelete.name}" will be permanently deleted. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(confirmDelete.id);
                    setConfirmDelete(null);
                  }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
// SAVE AS MODAL
// ============================================
// EXPIRATION MODAL
function SaveAsModal({ currentName, currentClient, clients, onSave, onClose }) {
  const [newName, setNewName] = useState(currentName ? `${currentName} (Copy)` : 'New Project');
  const [selectedClientId, setSelectedClientId] = useState('new'); // 'new' or existing client id
  const [newClientName, setNewClientName] = useState('');

  // Find current client in the list
  const existingClients = clients.filter(c => !c.archived);
  const currentClientObj = existingClients.find(c => c.name.toLowerCase() === currentClient?.toLowerCase());

  // Set initial selection based on currentClient
  useEffect(() => {
    if (currentClientObj) {
      setSelectedClientId(currentClientObj.id);
    } else if (currentClient) {
      setSelectedClientId('new');
      setNewClientName(currentClient);
    }
  }, []);

  const handleSave = () => {
    if (!newName.trim()) return;

    let clientName = '';
    if (selectedClientId === 'new') {
      clientName = newClientName.trim();
    } else {
      const client = existingClients.find(c => c.id === selectedClientId);
      clientName = client?.name || '';
    }

    onSave(newName.trim(), clientName);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-xl text-white mb-4">SAVE PROJECT</h2>

        {/* Client Selection */}
        <div className="mb-4">
          <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Client</label>
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              if (e.target.value !== 'new') {
                setNewClientName('');
              }
            }}
            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm focus:border-white focus:outline-none appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
          >
            <option value="new">+ New Client</option>
            {existingClients.length > 0 && (
              <option disabled className="text-zinc-600">──────────</option>
            )}
            {existingClients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        {/* New Client Name Input - only shown when "New Client" is selected */}
        {selectedClientId === 'new' && (
          <div className="mb-4">
            <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">New Client Name</label>
            <input
              type="text"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="e.g. Silver Dollar City"
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm placeholder-zinc-500 focus:border-white focus:outline-none"
            />
          </div>
        )}

        {/* Project Name */}
        <div className="mb-4">
          <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Project Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="e.g. Holiday Campaign 2025"
            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded text-white text-sm placeholder-zinc-500 focus:border-white focus:outline-none"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!newName.trim() || (selectedClientId === 'new' && !newClientName.trim())}
            className="flex-1 py-2.5 bg-white hover:bg-zinc-200 text-black rounded font-medium disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
// EXPORT PDF MODAL
// ============================================
// EXPIRATION MODAL
function ExportPdfModal({
  clientName,
  contactName,
  contactEmail,
  contactPhone,
  onContactNameChange,
  onContactEmailChange,
  onContactPhoneChange,
  onExport,
  onClose,
  isExporting,
  exportProgress
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-white font-medium">Export PDF</h2>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Client Name Display */}
          <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg">
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">Client</p>
            <p className="text-white">{clientName || 'Untitled Client'}</p>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
              Contact Information (shown on closing slide)
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={contactName || ''}
                onChange={(e) => onContactNameChange(e.target.value)}
                placeholder="Your name"
                disabled={isExporting}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:border-white focus:outline-none disabled:opacity-50 transition-colors"
              />
              <input
                type="email"
                value={contactEmail || ''}
                onChange={(e) => onContactEmailChange(e.target.value)}
                placeholder="Your email"
                disabled={isExporting}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:border-white focus:outline-none disabled:opacity-50 transition-colors"
              />
              <input
                type="tel"
                value={contactPhone || ''}
                onChange={(e) => onContactPhoneChange(e.target.value)}
                placeholder="Your phone"
                disabled={isExporting}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:border-white focus:outline-none disabled:opacity-50 transition-colors"
              />
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              This info will appear on the closing slide of your PDF
            </p>
          </div>

          {/* Export Button */}
          <button
            onClick={onExport}
            disabled={isExporting}
            className="w-full py-3 bg-white hover:bg-zinc-200 text-black rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="font-mono text-xs tracking-wider">
                  {exportProgress.total > 0 ? `EXPORTING ${exportProgress.current}/${exportProgress.total}` : 'EXPORTING...'}
                </span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
function ExpirationModal({ currentDays, onSetDays, onClose }) {
  const [days, setDays] = useState(currentDays || 30);

  const handleSet = () => {
    onSetDays(days);
    onClose();
  };

  const handleRemove = () => {
    onSetDays(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-white tracking-wider">PROPOSAL EXPIRATION</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <p className="text-sm text-zinc-400 mb-6">
          Set an expiration date to display on the last slide. This helps communicate offer validity to clients.
        </p>

        {/* Days input */}
        <div className="mb-6">
          <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
            Expires in (days)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="365"
              className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-zinc-500 text-center text-lg font-mono"
            />
            <span className="text-zinc-400">days</span>
          </div>
        </div>

        {/* Quick options */}
        <div className="flex gap-2 mb-6">
          {[7, 14, 30, 60, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`flex-1 py-2 rounded text-sm transition-colors ${
                days === d
                  ? 'bg-white text-black font-medium'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {currentDays && (
            <button
              onClick={handleRemove}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-sm transition-colors"
            >
              Remove
            </button>
          )}
          <button
            onClick={handleSet}
            className="flex-1 py-3 bg-white hover:bg-zinc-200 text-black rounded font-medium text-sm transition-colors"
          >
            {currentDays ? 'Update' : 'Set Expiration'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// EXPIRATION MODAL
// UTILITY COMPONENTS
// ============================================
// EXPIRATION MODAL
function EmptyState({ clients, caseStudies = [], onLoadProject, onLoadCaseStudy, onBrowseProjects, isMobile, onMobileInput }) {
  const [activeTab, setActiveTab] = useState('proposals');

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get ALL proposals across all clients (non-archived only), sorted by date
  const allProposals = clients
    .filter(c => !c.archived)
    .flatMap(c => c.projects.filter(p => !p.archived).map(p => ({ ...p, clientName: c.name })))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  // Sort case studies by date
  const sortedCaseStudies = [...caseStudies].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

  return (
    <div className="h-full flex flex-col p-6 sm:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <img src={LOGO_URL} alt="VALIDATE" className="h-10 sm:h-12 w-auto mx-auto mb-3" />
        <div className="w-12 h-[3px] bg-accent rounded-full mx-auto mb-3" />
        <p className="text-text-tertiary text-[10px] font-mono uppercase tracking-[0.2em]">Proposal Builder</p>
      </div>

      {/* Mobile: Show create button */}
      {isMobile && (
        <button
          onClick={onMobileInput}
          className="w-full mb-6 p-4 bg-accent hover:bg-accent-secondary text-white font-display text-lg rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-glow"
        >
          <Sparkles className="w-5 h-5" />
          NEW PROPOSAL
        </button>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors relative ${
            activeTab === 'proposals' ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Proposals</span>
          <span className="text-xs text-text-muted ml-1">({allProposals.length})</span>
          {activeTab === 'proposals' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('caseStudies')}
          className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors relative ${
            activeTab === 'caseStudies' ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Case Studies</span>
          <span className="text-xs text-text-muted ml-1">({sortedCaseStudies.length})</span>
          {activeTab === 'caseStudies' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full" />
          )}
        </button>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto scrollbar-dark">
        {activeTab === 'proposals' && (
          <>
            {allProposals.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-8 h-8 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary text-sm">No proposals yet</p>
                <p className="text-text-tertiary text-xs mt-1">Create your first proposal using the panel on the left</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allProposals.map(project => (
                  <button
                    key={project.id}
                    onClick={() => onLoadProject(project.id, project.clientName)}
                    className="w-full p-4 bg-bg-tertiary hover:bg-surface-hover border border-border hover:border-border-strong rounded-xl text-left transition-all group card-interactive"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-text-primary font-medium truncate">{project.name}</h4>
                        <span className="text-xs text-text-tertiary">{project.clientName}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors flex-shrink-0 ml-3" />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(project.updatedAt)}
                      </span>
                      <span className="text-text-muted">•</span>
                      <span>{project.slideCount} slides</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'caseStudies' && (
          <>
            {sortedCaseStudies.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="w-8 h-8 text-text-muted mx-auto mb-3" />
                <p className="text-text-secondary text-sm">No case studies yet</p>
                <p className="text-text-tertiary text-xs mt-1">Generate a case study using the panel on the left</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedCaseStudies.map(cs => (
                  <button
                    key={cs.id}
                    onClick={() => onLoadCaseStudy(cs.id)}
                    className="w-full p-4 bg-bg-tertiary hover:bg-surface-hover border border-border hover:border-border-strong rounded-xl text-left transition-all group card-interactive"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-text-primary font-medium truncate">{cs.name}</h4>
                        {cs.clientName && <span className="text-xs text-text-tertiary">{cs.clientName}</span>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors flex-shrink-0 ml-3" />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(cs.updatedAt || cs.createdAt)}
                      </span>
                      {cs.slideCount && (
                        <>
                          <span className="text-text-muted">•</span>
                          <span>{cs.slideCount} slides</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer hint - desktop only */}
      {!isMobile && (
        <div className="mt-6 flex items-center justify-center gap-2 text-text-muted">
          <ArrowLeft className="w-3 h-3" />
          <span className="font-mono text-[10px] uppercase tracking-wider">Enter details on the left to create new</span>
        </div>
      )}
    </div>
  );
}
function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-zinc-700 border-t-white rounded-full animate-spin mx-auto mb-6" />
        <p className="font-display text-xl text-white tracking-widest">GENERATING</p>
        <p className="text-zinc-600 text-xs font-mono mt-2 tracking-wider">PROPOSAL BUILDER</p>
      </div>
    </div>
  );
}

function ErrorToast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-neutral-800 border border-neutral-600 text-white px-4 py-3 rounded flex items-center gap-3 max-w-md">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-neutral-700 rounded"><X className="w-4 h-4" /></button>
    </div>
  );
}

function ValidationWarningsToast({ warnings, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 10000); return () => clearTimeout(t); }, [onClose]);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-amber-950/90 border border-amber-700/50 text-amber-100 px-4 py-3 rounded max-w-lg backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-amber-200 mb-1">
            Layout generated with {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
          </div>
          {warnings.length <= 3 || expanded ? (
            <ul className="text-xs text-amber-300/80 space-y-1 list-disc list-inside">
              {warnings.slice(0, expanded ? undefined : 3).map((w, i) => (
                <li key={i} className="truncate">{w}</li>
              ))}
            </ul>
          ) : (
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-amber-400 hover:text-amber-300 underline"
            >
              Show all {warnings.length} warnings
            </button>
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-amber-800/50 rounded flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

# VALIDATE Proposal Builder - Technical Documentation

## Architecture Overview

VALIDATE Proposal Builder is a Next.js 14 application that generates professional video production proposals using Claude AI. The application follows a monolithic component architecture where `ProposalMachine.jsx` (~9000 lines) serves as the main application container, housing the slide editor, AI chat interface, project management, and all supporting UI components. This design choice prioritizes rapid iteration over modularity, with state management handled through React hooks and refs.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with React 18
- **Styling**: Tailwind CSS with custom design tokens
- **Storage**: Supabase Storage (primary), no localStorage fallback
- **AI Text**: Anthropic Claude API (claude-opus-4-5-20251101 for generation, claude-sonnet-4 for refinement)
- **AI Images**: Google Gemini (gemini-2.0-flash-preview-image-generation)
- **PDF Export**: jsPDF + html2canvas for client-side PDF generation
- **Compression**: pako for gzip compression of large API payloads
- **Deployment**: Vercel with 300s function timeout for AI routes

## Core Data Structures

### Slide Schema
```javascript
{
  id: string,                    // Unique identifier (e.g., "slide-1704067200000-abc123")
  name: string,                  // Display name (e.g., "Cover", "Investment")
  background: {
    color: string,               // Hex color, default "#000000"
    image?: string,              // URL or base64 data URI
    opacity?: number,            // 0-1, default 1
    x?: number,                  // Pan position for cropped backgrounds
    y?: number,
    width?: number,
    height?: number
  },
  elements: Element[]            // Array of slide elements
}
```

### Element Types
```javascript
// Text Element
{
  id: string,
  type: "text",
  content: string,               // Plain text or HTML with <a> tags for links
  x: number, y: number,          // Position in 900x506 canvas
  width: number, height: number,
  fontSize: number,              // 11-56px, specific hierarchy enforced
  fontFamily: "Inter" | "Bebas Neue" | "JetBrains Mono",
  fontWeight: "normal" | "bold",
  color: string,                 // Hex color
  align: "left" | "center" | "right",
  hyperlink?: string             // Optional URL for entire element
}

// Image Element
{
  id: string,
  type: "image",
  src: string,                   // URL or base64
  videoSrc?: string,             // Optional MP4 URL for web playback
  x: number, y: number,
  width: number, height: number,
  frameStyle?: "none" | "rounded" | "validate",
  cropZoom?: number,             // 1-3, default 1
  cropX?: number,                // 0-100, crop position
  cropY?: number,
  opacity?: number
}

// Shape Element
{
  id: string,
  type: "shape",
  shapeType: "rect" | "ellipse",
  x: number, y: number,
  width: number, height: number,
  color: string,
  borderRadius?: number
}

// Video Element (YouTube/Vimeo embeds only)
{
  id: string,
  type: "video",
  videoUrl: string,              // YouTube or Vimeo URL
  x: number, y: number,
  width: number, height: number
}
```

## AI Chat System Architecture

The chat refinement system (`handleRefine` function) implements three distinct processing modes:

### 1. Visual Design Review (`isVisualReview`)
Triggered by: "look at the slides", "visually review", "see the design"

Process:
1. Renders each slide to a hidden DOM container at 1920x1080
2. Captures via html2canvas at 0.5 scale (960x540)
3. Converts to base64 JPEG at 70% quality
4. Sends up to 10 images to Claude's vision API
5. AI analyzes layout, spacing, typography, alignment
6. Returns JSON with `slideIssues[].fixes[]` containing property/value pairs
7. Applies fixes directly to slide elements

### 2. Two-Phase Complex Rewrite (`isComplexRewrite`)
Triggered by: "rewrite the entire proposal", "act as an expert", "improve everything"

**Phase 1 - Strategy Generation:**
- Extracts all text content from slides
- Identifies preserved elements (dollar amounts, dates via regex)
- Sends to Claude requesting a creative strategy (text only, no JSON)
- Returns narrative arc, slide-by-slide direction, tone guidance

**Phase 2 - Chunked Execution:**
- Processes slides in chunks of 3
- Each chunk receives full creative strategy as context
- AI outputs modified slides as JSON array
- Image/video sources replaced with placeholders, restored after parse
- Failed chunks keep original slides (graceful degradation)

### 3. Standard Single-Phase (`default`)
For simple modifications: "add an image", "change the headline", "move this element"

- Sends full slide JSON with images/videos replaced by `[IMG]`, `[VID]` placeholders
- AI returns `{action: "modify"|"add"|"chat", slides: [...], message: "..."}`
- Supports `images[]` array for AI-generated image requests
- Supports `libraryImages[]` for inserting from user's image library

## Storage Architecture

All persistence uses Supabase Storage via `/api/storage` route:

```
validate-projects/                    # Bucket name
├── projects/
│   └── project-{timestamp}.json     # Individual proposals
├── clients-index.json               # {clients: [{name, projects: [{id, name, updatedAt}]}]}
├── case-studies/
│   ├── cs-{timestamp}.json          # Individual case studies
│   └── index.json                   # {caseStudies: [{id, name, clientName, updatedAt}]}
├── shares/
│   └── {shareId}.json               # Snapshot for shared links
├── images/
│   └── {timestamp}-{random}.{ext}   # Uploaded images
├── videos/
│   └── {timestamp}-{random}.mp4     # Uploaded videos
├── image-metadata.json              # {path: {displayName, folderId, isVideo}}
└── assets/
    └── VALIDATE_W.png               # Brand logo
```

## Autosave System

The autosave runs on a 30-second interval using refs to avoid stale closures:

```javascript
// Critical refs that must stay in sync with state
slidesRef.current = slides;
projectNameRef.current = projectName;
clientNameRef.current = clientName;
currentProjectIdRef.current = currentProjectId;
```

**Race Condition Prevention:** When switching between proposal and case study modes, always clear the project ID ref BEFORE setting new slides to prevent the autosave from writing to the wrong project.

## PDF Export Pipeline

1. Creates hidden render container at 1920x1080 (2x canvas for retina)
2. Iterates slides, rendering each to DOM with scaled positions/fonts
3. Waits for image loads (100ms delay per slide)
4. Captures via html2canvas with CORS enabled
5. Converts to JPEG at 95% quality
6. Adds to jsPDF in landscape A4 (297x167mm)
7. Injects clickable mailto: links for email elements
8. Processes hyperlinks from text elements with position mapping

## Shared Proposal Viewer (`/p/[id]`)

The ProposalViewer renders slides as a cinematic scroll experience:
- Full-viewport slides with snap scrolling
- Background images render at full bleed
- Image elements with `videoSrc` render as `<video autoplay loop muted playsinline>`
- Text hyperlinks rendered as clickable `<a>` tags
- Keyboard navigation (arrow keys, space)

## Design System Constraints

**Typography Hierarchy (strictly enforced):**
- 56px: Hero headlines (cover only)
- 32px: Section titles
- 20px: Card titles
- 17px: Body text
- 13px: Labels
- 11px: Minimum (metadata only)

**Forbidden range:** 24-36px creates weak hierarchy

**Color Palette:**
- `#000000`: Background (always pure black)
- `#18181B`: Card backgrounds
- `#FFFFFF`: Headlines (Bebas Neue only)
- `#D4D4D8`: Body text
- `#71717A`: Muted/secondary
- `#C41E3A`: VALIDATE Red (accent only, 5-10% maximum)

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/generate` | POST | Proxies to Claude API, handles gzip decompression |
| `/api/generate-image` | POST | Generates images via Gemini, uploads to Supabase |
| `/api/storage` | GET/POST/DELETE | CRUD operations on Supabase Storage |
| `/api/storage/pdf` | POST | Server-side PDF generation (unused, client-side preferred) |
| `/api/share` | POST | Creates shareable proposal snapshots |
| `/api/auth` | GET/POST | Token-based authentication with rate limiting |

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
# Supabase credentials currently hardcoded in routes (migration needed)
```

## Known Patterns & Gotchas

1. **Element IDs**: Generated via `generateElementId()` using timestamp + random suffix. Must be unique within a slide.

2. **Image Library**: Mixed images and videos distinguished by `isVideo` flag in metadata. Videos detected by file extension fallback if metadata missing.

3. **Video Attachment**: Image elements can have optional `videoSrc` for web playback. PDF export uses `src` (poster image), web viewer uses `videoSrc`.

4. **JSON Parsing**: AI responses parsed via greedy regex `/\{[\s\S]*\}/`. Wrapped in try-catch with fallback to show raw response on parse failure.

5. **Payload Compression**: Large requests to `/api/generate` are gzip-compressed via pako to avoid Vercel's body size limits.

## Recent Additions (January 2025)

- Two-phase rewrite system for complex "rewrite everything" requests
- Visual design review with slide screenshot capture and Claude vision analysis
- Video attachment support for image elements (MP4 uploads to Supabase)
- PDF/WEB preview toggle for slides with video content
- Inline hyperlink support in text elements with floating toolbar
- Improved JSON error handling with user-friendly messages

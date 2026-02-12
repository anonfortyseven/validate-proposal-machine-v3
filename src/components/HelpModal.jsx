'use client'

import React, { useState } from 'react';
import {
  X, HelpCircle, Keyboard, MousePointer2, Sparkles, Image,
  Share2, Layers, Lightbulb, RotateCcw, Copy, Type, ZoomIn,
  Video, Wand2, Eye, PlusCircle, FileDown, Monitor
} from 'lucide-react';

const CATEGORIES = [
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'editing', label: 'Editing', icon: MousePointer2 },
  { id: 'ai-chat', label: 'AI Chat', icon: Sparkles },
  { id: 'media', label: 'Media', icon: Image },
  { id: 'sharing', label: 'Sharing', icon: Share2 },
  { id: 'slides', label: 'Slides', icon: Layers },
  { id: 'tips', label: 'Tips', icon: Lightbulb },
];

function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-bg-tertiary border border-border-strong rounded-md text-[11px] font-mono text-text-secondary shadow-sm">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, description }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-text-secondary">{description}</span>
      <div className="flex items-center gap-1 flex-shrink-0 ml-4">
        {keys.map((key, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-text-muted text-xs">+</span>}
            <Kbd>{key}</Kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mt-5 mb-3 first:mt-0">
      {children}
    </h3>
  );
}

function TipCard({ icon: Icon, title, description }) {
  return (
    <div className="flex gap-3 p-3 bg-bg-tertiary/50 border border-white/5 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeatureItem({ children }) {
  return (
    <li className="flex items-start gap-2.5 py-1.5">
      <span className="w-1 h-1 rounded-full bg-accent mt-2 flex-shrink-0" />
      <span className="text-sm text-text-secondary leading-relaxed">{children}</span>
    </li>
  );
}

function ShortcutsContent() {
  const isMac = typeof navigator !== 'undefined' && navigator.platform?.includes('Mac');
  const mod = isMac ? '\u2318' : 'Ctrl';

  return (
    <div>
      <SectionHeading>Navigation</SectionHeading>
      <div className="bg-bg-tertiary/30 rounded-xl border border-white/5 p-4">
        <ShortcutRow keys={['\u2190']} description="Previous slide" />
        <ShortcutRow keys={['\u2192']} description="Next slide" />
      </div>

      <SectionHeading>History</SectionHeading>
      <div className="bg-bg-tertiary/30 rounded-xl border border-white/5 p-4">
        <ShortcutRow keys={[mod, 'Z']} description="Undo" />
        <ShortcutRow keys={[mod, 'Shift', 'Z']} description="Redo" />
        <ShortcutRow keys={[mod, 'Y']} description="Redo (alt)" />
      </div>

      <SectionHeading>Elements</SectionHeading>
      <div className="bg-bg-tertiary/30 rounded-xl border border-white/5 p-4">
        <ShortcutRow keys={[mod, 'C']} description="Copy selected elements" />
        <ShortcutRow keys={[mod, 'V']} description="Paste elements" />
        <ShortcutRow keys={[mod, 'D']} description="Duplicate elements" />
        <ShortcutRow keys={['Delete']} description="Delete selected elements" />
      </div>

      <SectionHeading>Text Editing</SectionHeading>
      <div className="bg-bg-tertiary/30 rounded-xl border border-white/5 p-4">
        <ShortcutRow keys={['Double-click']} description="Edit text content" />
        <ShortcutRow keys={['Esc']} description="Exit text editing" />
        <ShortcutRow keys={['Enter']} description="New line (stays in edit mode)" />
      </div>
    </div>
  );
}

function EditingContent() {
  const isMac = typeof navigator !== 'undefined' && navigator.platform?.includes('Mac');
  const mod = isMac ? '\u2318' : 'Ctrl';

  return (
    <div>
      <SectionHeading>Selection</SectionHeading>
      <ul className="space-y-1">
        <FeatureItem>Click any element to select it</FeatureItem>
        <FeatureItem>
          Hold <Kbd>Shift</Kbd> and click to add to selection (multi-select)
        </FeatureItem>
        <FeatureItem>Multi-selected elements move together when dragged</FeatureItem>
      </ul>

      <SectionHeading>Moving & Resizing</SectionHeading>
      <ul className="space-y-1">
        <FeatureItem>Drag any selected element to reposition it on the canvas</FeatureItem>
        <FeatureItem>Use the 8 resize handles (4 corners + 4 edges) to resize</FeatureItem>
        <FeatureItem>Corner handles resize proportionally for images and videos</FeatureItem>
      </ul>

      <SectionHeading>Rotation</SectionHeading>
      <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl">
        <p className="text-sm text-text-secondary leading-relaxed">
          Hold <Kbd>R</Kbd> then drag a <strong className="text-text-primary">corner handle</strong> to rotate.
          Rotation snaps to 15° increments. Hold <Kbd>Shift</Kbd> while rotating for free rotation.
        </p>
      </div>

      <SectionHeading>Copy & Paste</SectionHeading>
      <ul className="space-y-1">
        <FeatureItem>
          Copy with <Kbd>{mod}</Kbd> + <Kbd>C</Kbd>, paste with <Kbd>{mod}</Kbd> + <Kbd>V</Kbd> on any slide
        </FeatureItem>
        <FeatureItem>Pasted elements appear offset from the original position</FeatureItem>
      </ul>
    </div>
  );
}

function AiChatContent() {
  return (
    <div>
      <SectionHeading>Standard Refinement</SectionHeading>
      <ul className="space-y-1">
        <FeatureItem>Ask to modify, restyle, or rewrite any text on your slides</FeatureItem>
        <FeatureItem>Request layout changes, color adjustments, or new elements</FeatureItem>
        <FeatureItem>AI preserves dollar amounts and dates during rewrites</FeatureItem>
      </ul>

      <SectionHeading>Special Commands</SectionHeading>
      <div className="space-y-2">
        <TipCard
          icon={Wand2}
          title={'"Rewrite the entire proposal"'}
          description="Triggers a two-phase creative rewrite. Phase 1 generates a strategy, Phase 2 rewrites slides in chunks. Dollar amounts and dates are preserved."
        />
        <TipCard
          icon={Eye}
          title={'"Look at the slides" or "visually review"'}
          description="AI captures screenshots and analyzes layout, spacing, typography, and alignment, then applies design fixes automatically."
        />
        <TipCard
          icon={PlusCircle}
          title={'"Add a slide about..."'}
          description="Generates new slides on the topic you specify, using your proposal's existing style and branding."
        />
      </div>
    </div>
  );
}

function MediaContent() {
  return (
    <div>
      <SectionHeading>Image Library</SectionHeading>
      <ul className="space-y-1">
        <FeatureItem>Upload images to your library and organize them into folders</FeatureItem>
        <FeatureItem>Drag an image from the library onto the slide to add it</FeatureItem>
        <FeatureItem>Double-click an image in the library to add it to the current slide</FeatureItem>
        <FeatureItem>Right-click images for a context menu (rename, move, download, delete)</FeatureItem>
      </ul>

      <SectionHeading>Image Cropping</SectionHeading>
      <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl">
        <p className="text-sm text-text-secondary leading-relaxed">
          When cropping, <strong className="text-text-primary">scroll to zoom</strong> (1x to 3x)
          and <strong className="text-text-primary">drag to reposition</strong> the visible area
          within the crop frame.
        </p>
      </div>

      <SectionHeading>Video Elements</SectionHeading>
      <ul className="space-y-1">
        <FeatureItem>Add video elements that support YouTube and Vimeo URLs</FeatureItem>
        <FeatureItem>Video carousel: add multiple videos to one element, each with its own title</FeatureItem>
        <FeatureItem>Images with video attachments play as silent loops in the web viewer</FeatureItem>
      </ul>

      <SectionHeading>Background Images</SectionHeading>
      <ul className="space-y-1">
        <FeatureItem>Set any image as a slide background</FeatureItem>
        <FeatureItem>Toggle "Resize & Position" to drag and resize the background on the canvas</FeatureItem>
      </ul>
    </div>
  );
}

function SharingContent() {
  return (
    <div>
      <SectionHeading>Share Links</SectionHeading>
      <ul className="space-y-1">
        <FeatureItem>Generate a shareable link to your proposal</FeatureItem>
        <FeatureItem>Optionally set a password to restrict access</FeatureItem>
        <FeatureItem>Set link expiration: 7, 30, or 90 days</FeatureItem>
        <FeatureItem>Toggle whether viewers can download as PDF</FeatureItem>
      </ul>

      <SectionHeading>Contact Info</SectionHeading>
      <ul className="space-y-1">
        <FeatureItem>Add your name, email, and phone number</FeatureItem>
        <FeatureItem>This info appears on the closing card of the shared proposal</FeatureItem>
      </ul>

      <SectionHeading>PDF Export</SectionHeading>
      <ul className="space-y-1">
        <FeatureItem>Export captures each slide as a high-resolution image</FeatureItem>
        <FeatureItem>Hyperlinks in text elements are preserved as clickable links</FeatureItem>
        <FeatureItem>Video elements show their poster image in the PDF</FeatureItem>
      </ul>
    </div>
  );
}

function SlidesContent() {
  return (
    <div>
      <SectionHeading>Reordering Slides</SectionHeading>
      <ul className="space-y-1">
        <FeatureItem>Use the up/down arrow buttons in the slide navigation to reorder</FeatureItem>
        <FeatureItem>The slide thumbnail strip shows your current position in the deck</FeatureItem>
      </ul>

      <SectionHeading>Preview Modes</SectionHeading>
      <div className="space-y-2">
        <TipCard
          icon={Monitor}
          title="Web Preview"
          description="Shows the live slide with video playback. Image elements with attached videos play as silent loops."
        />
        <TipCard
          icon={FileDown}
          title="PDF Preview"
          description="Shows the static version as it will appear in the exported PDF. Videos display their poster image."
        />
      </div>
    </div>
  );
}

function TipsContent() {
  return (
    <div className="space-y-2">
      <TipCard
        icon={MousePointer2}
        title="Multi-select with Shift+Click"
        description="Hold Shift and click multiple elements to select them all. Drag any one to move them together."
      />
      <TipCard
        icon={RotateCcw}
        title="Rotate with R + drag"
        description="Hold the R key, then drag any corner handle to rotate. Snaps to 15° steps. Add Shift for free rotation."
      />
      <TipCard
        icon={ZoomIn}
        title="Scroll to zoom in image cropper"
        description="When the image cropper is open, use your scroll wheel to zoom between 1x and 3x. Drag to reposition."
      />
      <TipCard
        icon={Type}
        title="Enter creates newlines"
        description="When editing text, pressing Enter adds a new line instead of confirming. Press Escape to exit text editing."
      />
      <TipCard
        icon={Video}
        title="Video loops in web view"
        description="Images with a video attachment play as silent, auto-looping videos in the shared web viewer. PDF export uses the poster image."
      />
      <TipCard
        icon={Copy}
        title="Cross-slide copy and paste"
        description="Copy elements on one slide, navigate to another, and paste. Elements are placed at an offset from their original position."
      />
      <TipCard
        icon={Sparkles}
        title="AI preserves your numbers"
        description="When AI rewrites content, it automatically detects and preserves dollar amounts, dates, and other key data."
      />
    </div>
  );
}

const CONTENT_MAP = {
  'shortcuts': ShortcutsContent,
  'editing': EditingContent,
  'ai-chat': AiChatContent,
  'media': MediaContent,
  'sharing': SharingContent,
  'slides': SlidesContent,
  'tips': TipsContent,
};

export default function HelpModal({ onClose }) {
  const [activeCategory, setActiveCategory] = useState('shortcuts');
  const ContentComponent = CONTENT_MAP[activeCategory];

  return (
    <div
      className="fixed inset-0 bg-bg-primary/95 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-secondary border border-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-fade-in-scale flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-tertiary/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="text-text-primary font-medium">Help Center</h2>
              <p className="text-text-tertiary text-xs">Shortcuts, features & tips</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
            <X className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        {/* Mobile tab bar */}
        <div className="md:hidden flex items-center gap-1 px-4 py-3 border-b border-border overflow-x-auto flex-shrink-0 no-scrollbar">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-hover'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Desktop sidebar */}
          <nav className="hidden md:flex flex-col w-48 border-r border-border py-3 px-2 flex-shrink-0">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors w-full text-left ${
                    isActive
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : ''}`} />
                  {cat.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <ContentComponent />
          </div>
        </div>
      </div>
    </div>
  );
}

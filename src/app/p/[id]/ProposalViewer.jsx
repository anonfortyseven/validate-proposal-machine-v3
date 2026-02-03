'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Lock, Download, Loader2, ChevronDown, ChevronRight, AlertCircle, Mail, Phone } from 'lucide-react';

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

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 506;

// ============================================
// PDF SLIDE CANVAS - Renders slide for PDF capture
// Uses the SAME ElementRenderer as web view for identical output
// ============================================
function PDFSlideCanvas({ slide }) {
  return (
    <div
      style={{
        position: 'relative',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: slide.background?.color || '#000000',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background image */}
      {slide.background?.image && (
        <div
          style={{
            position: 'absolute',
            left: slide.background.x ?? 0,
            top: slide.background.y ?? 0,
            width: slide.background.width ?? CANVAS_WIDTH,
            height: slide.background.height ?? CANVAS_HEIGHT,
            opacity: slide.background.opacity ?? 1,
          }}
        >
          <img
            src={slide.background.image}
            alt=""
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Elements - uses the SAME ElementRenderer as web view */}
      {(slide.elements || []).map((element) => (
        <PDFElementRenderer key={element.id} element={element} />
      ))}

      {/* Corner brackets */}
      <div style={{ position: 'absolute', top: 16, left: 16 }}>
        <div style={{ position: 'absolute', width: 20, height: 1, background: 'rgba(255,255,255,0.1)', top: 0, left: 0 }} />
        <div style={{ position: 'absolute', width: 1, height: 20, background: 'rgba(255,255,255,0.1)', top: 0, left: 0 }} />
        <div style={{ position: 'absolute', width: 3, height: 3, borderRadius: '50%', background: 'rgba(196,30,58,0.4)', top: -1, left: -1 }} />
      </div>
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <div style={{ position: 'absolute', width: 20, height: 1, background: 'rgba(255,255,255,0.1)', top: 0, right: 0 }} />
        <div style={{ position: 'absolute', width: 1, height: 20, background: 'rgba(255,255,255,0.1)', top: 0, right: 0 }} />
        <div style={{ position: 'absolute', width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', top: -1, right: -1 }} />
      </div>
      <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
        <div style={{ position: 'absolute', width: 20, height: 1, background: 'rgba(255,255,255,0.1)', bottom: 0, left: 0 }} />
        <div style={{ position: 'absolute', width: 1, height: 20, background: 'rgba(255,255,255,0.1)', bottom: 0, left: 0 }} />
      </div>
      <div style={{ position: 'absolute', bottom: 16, right: 16 }}>
        <div style={{ position: 'absolute', width: 20, height: 1, background: 'rgba(255,255,255,0.1)', bottom: 0, right: 0 }} />
        <div style={{ position: 'absolute', width: 1, height: 20, background: 'rgba(255,255,255,0.1)', bottom: 0, right: 0 }} />
        <div style={{ position: 'absolute', width: 3, height: 3, borderRadius: '50%', background: 'rgba(196,30,58,0.4)', bottom: -1, right: -1 }} />
      </div>
    </div>
  );
}

// PDF Element Renderer - matches ElementRenderer EXACTLY but for images uses crossOrigin
function PDFElementRenderer({ element }) {
  const { type, x, y, width, height } = element;

  if (type === 'text') {
    const textStyle = {
      position: 'absolute',
      left: x,
      top: y,
      width: width,
      minHeight: height,
      fontSize: element.fontSize,
      fontWeight: element.fontWeight,
      fontFamily:
        element.fontFamily === 'Bebas Neue'
          ? "'Bebas Neue', sans-serif"
          : element.fontFamily === 'JetBrains Mono'
          ? "'JetBrains Mono', monospace"
          : "'Inter', sans-serif",
      color: element.color,
      textAlign: element.align,
      fontStyle: element.fontStyle || 'normal',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent:
        element.align === 'center'
          ? 'center'
          : element.align === 'right'
          ? 'flex-end'
          : 'flex-start',
      lineHeight: 1.2,
    };

    return (
      <div style={textStyle}>
        <span style={{ whiteSpace: 'pre-wrap', lineHeight: 1.2 }}>
          {element.content || ''}
        </span>
      </div>
    );
  }

  if (type === 'shape') {
    const shapeStyle = {
      position: 'absolute',
      left: x,
      top: y,
      width: width,
      height: height,
      backgroundColor: element.color || '#FFFFFF',
      borderRadius: element.shapeType === 'ellipse' ? '50%' : element.borderRadius || 0,
    };
    return <div style={shapeStyle} />;
  }

  if (type === 'image') {
    const imageStyle = {
      position: 'absolute',
      left: x,
      top: y,
      width: width,
      height: height,
      overflow: 'hidden',
      borderRadius: element.frameStyle === 'rounded' ? 8 : 0,
    };

    // For PDF, always use static image (not video)
    return (
      <div style={imageStyle}>
        <img
          src={resolveImageSrc(element.src)}
          alt=""
          crossOrigin="anonymous"
          style={{
            width: '100%',
            height: '100%',
            objectFit: isLogoImage(element.src) ? 'contain' : 'cover',
            transform: isLogoImage(element.src) ? 'none' : (element.cropZoom ? `scale(${element.cropZoom})` : undefined),
            transformOrigin:
              element.cropX !== undefined && element.cropY !== undefined
                ? `${element.cropX}% ${element.cropY}%`
                : 'center',
          }}
        />
      </div>
    );
  }

  if (type === 'video') {
    const videoUrl = element.src || element.videoUrl;
    let thumbnailUrl = element.pdfThumbnail || null;

    const youtubeMatch = videoUrl?.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (youtubeMatch && !thumbnailUrl) {
      thumbnailUrl = `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
    }

    const videoStyle = {
      position: 'absolute',
      left: x,
      top: y,
      width: width,
      height: height,
      background: '#18181B',
      borderRadius: 8,
      overflow: 'hidden',
    };

    const playSize = Math.min(width, height) * 0.2;

    return (
      <div style={videoStyle}>
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            crossOrigin="anonymous"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: playSize,
              height: playSize,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${playSize * 0.35}px solid #000`,
                borderTop: `${playSize * 0.21}px solid transparent`,
                borderBottom: `${playSize * 0.21}px solid transparent`,
                marginLeft: playSize * 0.09,
              }}
            />
          </div>
          <div
            style={{
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            CLICK TO PLAY
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================
// CINEMATIC CORNER ACCENTS
// ============================================
function CornerAccents({ className = '' }) {
  return (
    <div className={`pointer-events-none ${className}`}>
      {/* Top Left */}
      <div className="fixed top-6 left-6 w-16 h-16 opacity-20">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-zinc-500 to-transparent" />
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-zinc-500 to-transparent" />
        <div className="absolute top-2 left-2 w-1 h-1 bg-[#C41E3A] rounded-full" style={{ boxShadow: '0 0 8px rgba(196, 30, 58, 0.6)' }} />
      </div>
      {/* Top Right */}
      <div className="fixed top-6 right-6 w-16 h-16 opacity-20">
        <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-zinc-500 to-transparent" />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-zinc-500 to-transparent" />
      </div>
      {/* Bottom Left */}
      <div className="fixed bottom-6 left-6 w-16 h-16 opacity-20">
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-zinc-500 to-transparent" />
        <div className="absolute bottom-0 left-0 w-px h-full bg-gradient-to-t from-zinc-500 to-transparent" />
      </div>
      {/* Bottom Right */}
      <div className="fixed bottom-6 right-6 w-16 h-16 opacity-20">
        <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-zinc-500 to-transparent" />
        <div className="absolute bottom-0 right-0 w-px h-full bg-gradient-to-t from-zinc-500 to-transparent" />
        <div className="absolute bottom-2 right-2 w-1 h-1 bg-[#C41E3A] rounded-full" style={{ boxShadow: '0 0 8px rgba(196, 30, 58, 0.6)' }} />
      </div>
    </div>
  );
}

// ============================================
// ATMOSPHERIC BACKGROUND
// ============================================
function AtmosphericBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Subtle radial gradient from top */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(196, 30, 58, 0.08) 0%, transparent 60%)',
        }}
      />
      {/* Subtle vignette effect - fades out grid at edges */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </div>
  );
}

// ============================================
// SCROLL PROGRESS INDICATOR
// ============================================
function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      setProgress(scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-zinc-900">
      <div
        className="h-full bg-gradient-to-r from-[#C41E3A] to-[#ff4d6a] transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ============================================
// ANIMATED SLIDE WRAPPER
// ============================================
function AnimatedSlide({ children, index, isVisible }) {
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isVisible && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isVisible, hasAnimated]);

  return (
    <div
      className="transition-all duration-700 ease-out"
      style={{
        opacity: hasAnimated ? 1 : 0,
        transform: hasAnimated ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.98)',
        transitionDelay: `${index * 50}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ============================================
// FONTS READY HOOK
// ============================================
function useFontsReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.fonts.ready.then(() => setReady(true));
  }, []);

  return ready;
}

// ============================================
// INTERSECTION OBSERVER HOOK
// ============================================
function useIntersectionObserver(options = {}) {
  const [visibleSlides, setVisibleSlides] = useState(new Set());
  const observerRef = useRef(null);

  const observe = useCallback((element, index) => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const idx = parseInt(entry.target.dataset.index);
            setVisibleSlides((prev) => {
              const next = new Set(prev);
              if (entry.isIntersecting) {
                next.add(idx);
              }
              return next;
            });
          });
        },
        { threshold: 0.1, rootMargin: '50px', ...options }
      );
    }
    if (element) {
      element.dataset.index = index;
      observerRef.current.observe(element);
    }
  }, [options]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { observe, visibleSlides };
}

// ============================================
// SLIDE RENDERER - CINEMATIC VERSION
// Uses forwardRef to expose inner canvas for PDF capture
// ============================================
const SlideRenderer = React.forwardRef(function SlideRenderer({ slide, containerWidth, isActive }, ref) {
  const scale = Math.min(containerWidth / CANVAS_WIDTH, 1);

  return (
    <div
      className="relative rounded-xl overflow-hidden transition-all duration-500"
      style={{
        width: CANVAS_WIDTH * scale,
        height: CANVAS_HEIGHT * scale,
        boxShadow: isActive
          ? '0 0 0 1px rgba(196, 30, 58, 0.2), 0 25px 80px -12px rgba(0, 0, 0, 0.9), 0 0 60px -20px rgba(196, 30, 58, 0.15)'
          : '0 25px 60px -12px rgba(0, 0, 0, 0.8)',
      }}
    >
      {/* Canvas container - ref exposed for PDF capture */}
      <div
        ref={ref}
        className="relative slide-canvas-inner"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          backgroundColor: slide.background?.color || '#000000',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Background image */}
        {slide.background?.image && (
          <div
            className="absolute"
            style={{
              left: slide.background.x ?? 0,
              top: slide.background.y ?? 0,
              width: slide.background.width ?? CANVAS_WIDTH,
              height: slide.background.height ?? CANVAS_HEIGHT,
              opacity: slide.background.opacity ?? 1,
            }}
          >
            <img
              src={slide.background.image}
              alt=""
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              draggable={false}
            />
          </div>
        )}

        {/* Elements */}
        {(slide.elements || []).map((element) => (
          <ElementRenderer key={element.id} element={element} />
        ))}
      </div>
    </div>
  );
});

// ============================================
// ELEMENT RENDERER
// ============================================
function ElementRenderer({ element }) {
  const { type, x, y, width, height } = element;

  if (type === 'text') {
    const textStyle = {
      position: 'absolute',
      left: x,
      top: y,
      width: width,
      minHeight: height,
      fontSize: element.fontSize,
      fontWeight: element.fontWeight,
      fontFamily:
        element.fontFamily === 'Bebas Neue'
          ? "'Bebas Neue', sans-serif"
          : element.fontFamily === 'JetBrains Mono'
          ? "'JetBrains Mono', monospace"
          : "'Inter', sans-serif",
      color: element.color,
      textAlign: element.align,
      fontStyle: element.fontStyle || 'normal',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent:
        element.align === 'center'
          ? 'center'
          : element.align === 'right'
          ? 'flex-end'
          : 'flex-start',
      lineHeight: 1.2,
    };

    return (
      <div style={textStyle}>
        <span style={{ whiteSpace: 'pre-wrap' }}>
          <RenderTextWithLinks
            content={element.content}
            links={element.links}
            linkColor={element.linkColor || '#3B82F6'}
          />
        </span>
      </div>
    );
  }

  if (type === 'shape') {
    const shapeStyle = {
      position: 'absolute',
      left: x,
      top: y,
      width: width,
      height: height,
      backgroundColor: element.color || '#FFFFFF',
      borderRadius: element.shapeType === 'ellipse' ? '50%' : element.borderRadius || 0,
    };
    return <div style={shapeStyle} />;
  }

  if (type === 'image') {
    const imageStyle = {
      position: 'absolute',
      left: x,
      top: y,
      width: width,
      height: height,
      overflow: 'hidden',
      borderRadius: element.frameStyle === 'rounded' ? 8 : 0,
    };

    if (element.videoSrc) {
      return (
        <div style={imageStyle}>
          <video
            src={element.videoSrc}
            poster={resolveImageSrc(element.src)}
            crossOrigin="anonymous"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    return (
      <div style={imageStyle}>
        <img
          src={resolveImageSrc(element.src)}
          alt=""
          crossOrigin="anonymous"
          className={`w-full h-full ${isLogoImage(element.src) ? 'object-contain' : 'object-cover'}`}
          style={{
            transform: isLogoImage(element.src) ? 'none' : (element.cropZoom ? `scale(${element.cropZoom})` : undefined),
            transformOrigin:
              element.cropX !== undefined && element.cropY !== undefined
                ? `${element.cropX}% ${element.cropY}%`
                : 'center',
          }}
        />
      </div>
    );
  }

  if (type === 'video') {
    const videoUrl = element.src || element.videoUrl;
    const embedUrl = getEmbedUrl(videoUrl);

    const videoStyle = {
      position: 'absolute',
      left: x,
      top: y,
      width: width,
      height: height,
    };

    if (embedUrl) {
      return (
        <div style={videoStyle}>
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      );
    }

    return null;
  }

  return null;
}

// ============================================
// VIDEO URL PARSER
// ============================================
function getEmbedUrl(url) {
  if (!url) return null;

  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0`;
  }

  const vimeoUnlistedMatch = url.match(/vimeo\.com\/(\d+)\/([a-zA-Z0-9]+)/);
  if (vimeoUnlistedMatch) {
    return `https://player.vimeo.com/video/${vimeoUnlistedMatch[1]}?h=${vimeoUnlistedMatch[2]}`;
  }

  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
}

// ============================================
// TEXT WITH LINKS RENDERER
// ============================================
function RenderTextWithLinks({ content, links, linkColor }) {
  if (!links || links.length === 0) {
    return content;
  }

  const sortedLinks = [...links].sort((a, b) => a.start - b.start);
  const parts = [];
  let lastEnd = 0;

  for (const link of sortedLinks) {
    if (link.start > lastEnd) {
      parts.push(<span key={`text-${lastEnd}`}>{content.substring(lastEnd, link.start)}</span>);
    }
    parts.push(
      <a
        key={`link-${link.start}`}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
        style={{
          color: linkColor || '#60A5FA',
          textDecoration: 'underline',
          textUnderlineOffset: '2px',
        }}
      >
        {content.substring(link.start, link.end)}
      </a>
    );
    lastEnd = link.end;
  }

  if (lastEnd < content.length) {
    parts.push(<span key={`text-${lastEnd}`}>{content.substring(lastEnd)}</span>);
  }

  return <>{parts}</>;
}

// ============================================
// PASSWORD GATE - CINEMATIC VERSION
// ============================================
function PasswordGate({ onUnlock, shareId }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', id: shareId, password }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem(`share_${shareId}`, 'unlocked');
        onUnlock(data.share);
      } else {
        setError('Invalid password');
        setPassword('');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-accent/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div
        className="relative z-10 w-full max-w-md transition-all duration-700 ease-out"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
        }}
      >
        <div className="p-8 bg-bg-secondary/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src={LOGO_URL}
              alt="VALIDATE"
              className="h-8 w-auto mx-auto mb-6"
            />
            <div className="w-12 h-1 bg-accent rounded-full mx-auto mb-6" />
          </div>

          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Lock className="w-7 h-7 text-accent" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-8">
            <h1 className="text-text-primary text-xl font-medium mb-2">Protected Proposal</h1>
            <p className="text-text-tertiary text-sm">Enter the password to view this proposal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                disabled={isLoading}
                className="w-full px-4 py-4 bg-bg-tertiary border border-border rounded-xl text-text-primary placeholder-text-muted focus:border-accent focus:ring-2 focus:ring-accent-subtle focus:outline-none transition-all text-center text-lg tracking-wider"
              />
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-status-error text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-4 bg-accent hover:bg-accent-secondary disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 hover:shadow-glow flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>View Proposal</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-text-muted text-xs mt-6">
            Powered by VALIDATE
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CINEMATIC LOADING STATE (for actual data loading)
// ============================================
function LoadingState() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      <AtmosphericBackground />
      <div className="relative z-10">
        <div className="w-8 h-8 mx-auto">
          <div className="w-full h-full border border-zinc-800 border-t-[#C41E3A] rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// CINEMATIC INTRO SEQUENCE - GEOMETRIC GRID EDITION
// ============================================
function CinematicIntro({ clientName, projectName, onComplete }) {
  const [phase, setPhase] = useState(0);
  // Phase 0: Black void
  // Phase 1: Grid lines emerge from center
  // Phase 2: Corner frames build, red scan line sweeps
  // Phase 3: VALIDATE logo reveals
  // Phase 4: Client name types in
  // Phase 5: Project name explodes in
  // Phase 6: Everything collapses out

  useEffect(() => {
    const timings = [200, 800, 1600, 2400, 3200, 4200];
    const timeouts = timings.map((delay, i) =>
      setTimeout(() => setPhase(i + 1), delay)
    );

    const completeTimeout = setTimeout(() => onComplete(), 5000);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">

      {/* ===== GEOMETRIC GRID SYSTEM ===== */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Horizontal grid lines - draw from center */}
        {[...Array(7)].map((_, i) => {
          const offset = (i - 3) * 60;
          return (
            <div
              key={`h-${i}`}
              className="absolute h-px bg-zinc-800 transition-all ease-out"
              style={{
                top: `calc(50% + ${offset}px)`,
                left: '50%',
                transform: 'translateX(-50%)',
                width: phase >= 1 ? '80vw' : '0px',
                opacity: phase >= 6 ? 0 : (i === 3 ? 0.4 : 0.15),
                transitionDuration: `${600 + i * 100}ms`,
                transitionDelay: `${i * 50}ms`,
              }}
            />
          );
        })}

        {/* Vertical grid lines - draw from center */}
        {[...Array(9)].map((_, i) => {
          const offset = (i - 4) * 100;
          return (
            <div
              key={`v-${i}`}
              className="absolute w-px bg-zinc-800 transition-all ease-out"
              style={{
                left: `calc(50% + ${offset}px)`,
                top: '50%',
                transform: 'translateY(-50%)',
                height: phase >= 1 ? '60vh' : '0px',
                opacity: phase >= 6 ? 0 : (i === 4 ? 0.4 : 0.12),
                transitionDuration: `${600 + i * 80}ms`,
                transitionDelay: `${i * 40}ms`,
              }}
            />
          );
        })}

        {/* Red scan line - horizontal sweep */}
        <div
          className="absolute h-[2px] bg-gradient-to-r from-transparent via-[#C41E3A] to-transparent transition-all ease-in-out"
          style={{
            width: '100vw',
            top: '50%',
            left: phase >= 2 ? '100%' : '-100%',
            transform: 'translateY(-50%)',
            transitionDuration: '1200ms',
            transitionDelay: phase >= 2 ? '0ms' : '0ms',
            opacity: phase >= 3 ? 0 : 0.8,
            boxShadow: '0 0 30px 10px rgba(196, 30, 58, 0.3)',
          }}
        />

        {/* Corner frame brackets */}
        {/* Top Left */}
        <div className="absolute top-[15%] left-[10%]">
          <div
            className="absolute top-0 left-0 bg-white transition-all ease-out"
            style={{
              width: phase >= 2 ? '60px' : '0px',
              height: '1px',
              opacity: phase >= 6 ? 0 : 0.6,
              transitionDuration: '500ms',
              transitionDelay: '100ms',
            }}
          />
          <div
            className="absolute top-0 left-0 bg-white transition-all ease-out"
            style={{
              width: '1px',
              height: phase >= 2 ? '60px' : '0px',
              opacity: phase >= 6 ? 0 : 0.6,
              transitionDuration: '500ms',
              transitionDelay: '200ms',
            }}
          />
          <div
            className="absolute top-[-3px] left-[-3px] w-[7px] h-[7px] bg-[#C41E3A] transition-all ease-out"
            style={{
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? 'scale(1)' : 'scale(0)',
              transitionDuration: '300ms',
              transitionDelay: '400ms',
              boxShadow: '0 0 20px 4px rgba(196, 30, 58, 0.6)',
            }}
          />
        </div>

        {/* Top Right */}
        <div className="absolute top-[15%] right-[10%]">
          <div
            className="absolute top-0 right-0 bg-white transition-all ease-out"
            style={{
              width: phase >= 2 ? '60px' : '0px',
              height: '1px',
              opacity: phase >= 6 ? 0 : 0.6,
              transitionDuration: '500ms',
              transitionDelay: '150ms',
            }}
          />
          <div
            className="absolute top-0 right-0 bg-white transition-all ease-out"
            style={{
              width: '1px',
              height: phase >= 2 ? '60px' : '0px',
              opacity: phase >= 6 ? 0 : 0.6,
              transitionDuration: '500ms',
              transitionDelay: '250ms',
            }}
          />
        </div>

        {/* Bottom Left */}
        <div className="absolute bottom-[15%] left-[10%]">
          <div
            className="absolute bottom-0 left-0 bg-white transition-all ease-out"
            style={{
              width: phase >= 2 ? '60px' : '0px',
              height: '1px',
              opacity: phase >= 6 ? 0 : 0.6,
              transitionDuration: '500ms',
              transitionDelay: '200ms',
            }}
          />
          <div
            className="absolute bottom-0 left-0 bg-white transition-all ease-out"
            style={{
              width: '1px',
              height: phase >= 2 ? '60px' : '0px',
              opacity: phase >= 6 ? 0 : 0.6,
              transitionDuration: '500ms',
              transitionDelay: '300ms',
            }}
          />
        </div>

        {/* Bottom Right */}
        <div className="absolute bottom-[15%] right-[10%]">
          <div
            className="absolute bottom-0 right-0 bg-white transition-all ease-out"
            style={{
              width: phase >= 2 ? '60px' : '0px',
              height: '1px',
              opacity: phase >= 6 ? 0 : 0.6,
              transitionDuration: '500ms',
              transitionDelay: '250ms',
            }}
          />
          <div
            className="absolute bottom-0 right-0 bg-white transition-all ease-out"
            style={{
              width: '1px',
              height: phase >= 2 ? '60px' : '0px',
              opacity: phase >= 6 ? 0 : 0.6,
              transitionDuration: '500ms',
              transitionDelay: '350ms',
            }}
          />
          <div
            className="absolute bottom-[-3px] right-[-3px] w-[7px] h-[7px] bg-[#C41E3A] transition-all ease-out"
            style={{
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? 'scale(1)' : 'scale(0)',
              transitionDuration: '300ms',
              transitionDelay: '500ms',
              boxShadow: '0 0 20px 4px rgba(196, 30, 58, 0.6)',
            }}
          />
        </div>
      </div>

      {/* ===== CENTER CONTENT ===== */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* VALIDATE Logo - LARGE */}
        <div
          className="transition-all ease-out"
          style={{
            opacity: phase >= 3 ? (phase >= 6 ? 0 : 1) : 0,
            transform: phase >= 3
              ? phase >= 6
                ? 'translateY(-20px) scale(0.9)'
                : 'translateY(0) scale(1)'
              : 'translateY(30px) scale(0.8)',
            transitionDuration: '800ms',
            transitionDelay: phase >= 3 && phase < 6 ? '0ms' : '0ms',
          }}
        >
          <img
            src={LOGO_URL}
            alt="VALIDATE"
            className="h-10 md:h-14 w-auto mx-auto"
          />
        </div>

        {/* Red accent bar - expands from center */}
        <div
          className="my-8 h-[3px] bg-[#C41E3A] transition-all ease-out"
          style={{
            width: phase >= 3 ? (phase >= 6 ? '0px' : '120px') : '0px',
            opacity: phase >= 3 ? (phase >= 6 ? 0 : 1) : 0,
            transitionDuration: '600ms',
            transitionDelay: '200ms',
            boxShadow: '0 0 20px 2px rgba(196, 30, 58, 0.5)',
          }}
        />

        {/* Client name - types in with mono aesthetic */}
        <div
          className="mb-6 overflow-hidden transition-all ease-out"
          style={{
            opacity: phase >= 4 ? (phase >= 6 ? 0 : 1) : 0,
            transform: phase >= 4
              ? phase >= 6
                ? 'translateY(-10px)'
                : 'translateY(0)'
              : 'translateY(20px)',
            transitionDuration: '600ms',
          }}
        >
          <p
            className="text-zinc-400 text-sm md:text-base tracking-[0.4em] uppercase"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {clientName || 'Creative Proposal'}
          </p>
        </div>

        {/* Project name - THE HERO - massive reveal */}
        <div
          className="transition-all ease-out overflow-hidden"
          style={{
            opacity: phase >= 5 ? (phase >= 6 ? 0 : 1) : 0,
            transform: phase >= 5
              ? phase >= 6
                ? 'translateY(-20px) scale(0.95)'
                : 'translateY(0) scale(1)'
              : 'translateY(50px) scale(0.9)',
            transitionDuration: '800ms',
            transitionDelay: phase === 5 ? '100ms' : '0ms',
          }}
        >
          <h1
            className="text-white text-5xl md:text-7xl lg:text-8xl tracking-wider text-center px-4"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              textShadow: '0 0 60px rgba(255, 255, 255, 0.1)',
            }}
          >
            {projectName?.toUpperCase() || 'CREATIVE PROPOSAL'}
          </h1>
        </div>
      </div>

      {/* ===== GEOMETRIC ACCENTS - floating rectangles ===== */}
      {/* Top left geometric */}
      <div
        className="absolute top-[20%] left-[5%] border border-zinc-700 transition-all ease-out"
        style={{
          width: phase >= 2 ? '40px' : '0px',
          height: phase >= 2 ? '80px' : '0px',
          opacity: phase >= 6 ? 0 : 0.3,
          transitionDuration: '700ms',
          transitionDelay: '600ms',
        }}
      />

      {/* Bottom right geometric */}
      <div
        className="absolute bottom-[25%] right-[8%] border border-zinc-700 transition-all ease-out"
        style={{
          width: phase >= 2 ? '60px' : '0px',
          height: phase >= 2 ? '40px' : '0px',
          opacity: phase >= 6 ? 0 : 0.25,
          transitionDuration: '700ms',
          transitionDelay: '700ms',
        }}
      />

      {/* Small red square accent */}
      <div
        className="absolute top-[30%] right-[15%] bg-[#C41E3A] transition-all ease-out"
        style={{
          width: phase >= 3 ? '8px' : '0px',
          height: phase >= 3 ? '8px' : '0px',
          opacity: phase >= 6 ? 0 : 0.8,
          transitionDuration: '400ms',
          transitionDelay: '800ms',
          boxShadow: '0 0 15px 3px rgba(196, 30, 58, 0.4)',
        }}
      />

    </div>
  );
}

// ============================================
// CINEMATIC END CARD
// ============================================
function EndCard({ shareData, onDownloadPdf, isExporting, exportProgress }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="mt-24 mb-12 text-center transition-all duration-700"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(30px)',
      }}
    >
      <div className="inline-block p-10 bg-bg-secondary/80 backdrop-blur-md border border-border rounded-2xl max-w-md">
        {/* Thank You Header */}
        <div className="mb-8">
          <h2
            className="text-4xl text-text-primary tracking-wider mb-3"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            THANK YOU
          </h2>
          <div className="w-16 h-1 bg-accent rounded-full mx-auto" />
        </div>

        <p className="text-text-secondary text-sm mb-8">
          Please reach out to discuss next steps.
        </p>

        {/* Contact Info */}
        <div className="space-y-3 mb-8 p-6 bg-bg-tertiary/50 rounded-xl border border-border">
          {shareData.contactName && (
            <p className="text-text-primary font-medium text-lg">{shareData.contactName}</p>
          )}
          {shareData.contactEmail && (
            <a
              href={`mailto:${shareData.contactEmail}`}
              className="flex items-center justify-center gap-2 text-text-secondary hover:text-accent transition-colors"
            >
              <Mail className="w-4 h-4" />
              {shareData.contactEmail}
            </a>
          )}
          {shareData.contactPhone && (
            <a
              href={`tel:${shareData.contactPhone}`}
              className="flex items-center justify-center gap-2 text-text-secondary hover:text-accent transition-colors"
            >
              <Phone className="w-4 h-4" />
              {shareData.contactPhone}
            </a>
          )}
        </div>

        {/* Download button */}
        <button
          onClick={onDownloadPdf}
          disabled={isExporting}
          className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-accent hover:bg-accent-secondary disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 hover:shadow-glow"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Exporting {exportProgress.current}/{exportProgress.total}...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </>
          )}
        </button>
      </div>

      {/* VALIDATE branding */}
      <div className="mt-12">
        <div className="w-8 h-1 bg-accent/30 rounded-full mx-auto mb-4" />
        <p className="text-[10px] font-mono tracking-[0.3em] text-text-muted uppercase">
          Powered by VALIDATE
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN VIEWER COMPONENT
// ============================================
export default function ProposalViewer({ share, hasPassword, shareId }) {
  const fontsReady = useFontsReady();
  const [isUnlocked, setIsUnlocked] = useState(!hasPassword);
  const [shareData, setShareData] = useState(hasPassword ? null : share);
  const [showIntro, setShowIntro] = useState(true);
  const [introComplete, setIntroComplete] = useState(false);
  const [containerWidth, setContainerWidth] = useState(900);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const containerRef = useRef(null);
  const slideRefs = useRef([]);
  const canvasRefs = useRef([]);  // Refs to inner 900x506 canvas divs for PDF capture
  const { observe, visibleSlides } = useIntersectionObserver();

  // Handle intro completion
  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    setIntroComplete(true);
  }, []);

  // Check session storage for password
  useEffect(() => {
    if (hasPassword) {
      const unlocked = sessionStorage.getItem(`share_${shareId}`);
      if (unlocked === 'unlocked') {
        setIsUnlocked(true);
        setShareData(share);
      }
    }
  }, [hasPassword, shareId, share]);

  // Track view count
  useEffect(() => {
    if (isUnlocked && shareData) {
      fetch('/api/share', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shareId }),
      }).catch(() => {});
    }
  }, [isUnlocked, shareData, shareId]);

  // Measure container width
  useEffect(() => {
    if (!isUnlocked) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [isUnlocked]);

  // Track current slide and header visibility on scroll
  useEffect(() => {
    if (!isUnlocked || !shareData) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;

      // Hide header on scroll down, show on scroll up
      if (scrollY > lastScrollY && scrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      setLastScrollY(scrollY);

      // Track current slide
      slideRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const middle = rect.top + rect.height / 2;
          if (middle > 0 && middle < window.innerHeight) {
            setCurrentSlide(index + 1);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isUnlocked, shareData, lastScrollY]);

  // Keyboard navigation
  useEffect(() => {
    if (!isUnlocked || !shareData) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        const nextSlide = Math.min(currentSlide, shareData.slides.length - 1);
        slideRefs.current[nextSlide]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevSlide = Math.max(currentSlide - 2, 0);
        slideRefs.current[prevSlide]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, shareData, currentSlide]);

  const handleUnlock = (unlockedShare) => {
    setIsUnlocked(true);
    setShareData(unlockedShare);
  };

  // PDF download function - captures ACTUAL visible DOM for identical output
  const downloadPdf = async () => {
    console.log('[PDF Export v5] Starting - capturing actual DOM');
    if (!shareData?.slides?.length || isExporting) return;

    setIsExporting(true);
    setExportProgress({ current: 0, total: shareData.slides.length });

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const slides = shareData.slides;
      const pdfWidth = 297;
      const pdfHeight = 167;
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      });

      const OUTPUT_W = 1920;
      const OUTPUT_H = 1080;
      const captureScale = OUTPUT_W / CANVAS_WIDTH;

      // Ensure fonts are loaded
      await Promise.all([
        document.fonts.load('400 17px "Inter"'),
        document.fonts.load('600 17px "Inter"'),
        document.fonts.load('400 56px "Bebas Neue"'),
        document.fonts.load('400 13px "JetBrains Mono"'),
      ]);
      await document.fonts.ready;

      for (let i = 0; i < slides.length; i++) {
        setExportProgress({ current: i + 1, total: slides.length });
        const slide = slides[i];

        // Get the ACTUAL visible canvas element from the DOM
        const canvasEl = canvasRefs.current[i];
        if (!canvasEl) {
          console.warn(`Canvas ref not found for slide ${i}`);
          continue;
        }

        // Store original transform and temporarily remove it
        const originalTransform = canvasEl.style.transform;
        canvasEl.style.transform = 'none';

        // Wait a frame for the layout to update
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => setTimeout(resolve, 50));

        // Capture the ACTUAL DOM element that the user sees
        const canvas = await html2canvas(canvasEl, {
          scale: captureScale,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          windowWidth: CANVAS_WIDTH,
          windowHeight: CANVAS_HEIGHT,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#000000',
          logging: false,
        });

        // Restore the original transform
        canvasEl.style.transform = originalTransform;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) {
          pdf.addPage([pdfWidth, pdfHeight], 'landscape');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

        // Add links for this slide
        const pdfScaleX = pdfWidth / OUTPUT_W;
        const pdfScaleY = pdfHeight / OUTPUT_H;

        for (const element of slide.elements) {
          // Text hyperlinks
          if (element.type === 'text' && element.hyperlink) {
            pdf.link(
              element.x * captureScale * pdfScaleX,
              element.y * captureScale * pdfScaleY,
              element.width * captureScale * pdfScaleX,
              element.height * captureScale * pdfScaleY,
              { url: element.hyperlink }
            );
          }
          // Video links
          if (element.type === 'video') {
            const videoUrl = element.src || element.videoUrl;
            let videoLink = videoUrl;
            const youtubeMatch = videoUrl?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (youtubeMatch) videoLink = `https://www.youtube.com/watch?v=${youtubeMatch[1]}`;
            const vimeoMatch = videoUrl?.match(/vimeo\.com\/(\d+)/);
            if (vimeoMatch) videoLink = `https://vimeo.com/${vimeoMatch[1]}`;
            if (videoLink) {
              pdf.link(
                element.x * captureScale * pdfScaleX,
                element.y * captureScale * pdfScaleY,
                element.width * captureScale * pdfScaleX,
                element.height * captureScale * pdfScaleY,
                { url: videoLink }
              );
            }
          }
        }
      }

      const safeClientName = (shareData.clientName || 'proposal').replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`${safeClientName}-proposal-${timestamp}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  if (!isUnlocked) {
    return <PasswordGate onUnlock={handleUnlock} shareId={shareId} />;
  }

  if (!shareData || !fontsReady) {
    return <LoadingState />;
  }

  const slides = shareData.slides || [];

  // Show cinematic intro after data loads
  if (showIntro) {
    return (
      <CinematicIntro
        clientName={shareData.clientName}
        projectName={shareData.projectName}
        onComplete={handleIntroComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      <AtmosphericBackground />
      <CornerAccents />
      <ScrollProgress />

      {/* Cinematic Header */}
      <header
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
          opacity: headerVisible ? 1 : 0,
        }}
      >
        <div className="bg-black/80 backdrop-blur-xl border-b border-zinc-800/30">
          <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
            <img src={LOGO_URL} alt="VALIDATE" className="h-4 w-auto opacity-70" />

            <div className="text-center">
              <h1
                className="text-sm text-white/90 tracking-[0.2em]"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                {shareData.projectName?.toUpperCase()}
              </h1>
              {shareData.clientName && (
                <p className="text-[10px] text-zinc-500 tracking-wider mt-0.5">{shareData.clientName}</p>
              )}
            </div>

            <div className="font-mono text-xs text-zinc-500 tabular-nums">
              <span className="text-white">{String(currentSlide).padStart(2, '0')}</span>
              <span className="mx-1.5 text-zinc-700">/</span>
              <span>{String(slides.length).padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Slides */}
      <main className="relative z-10 max-w-6xl mx-auto px-8 pt-28 pb-12">
        <div ref={containerRef} className="flex flex-col items-center gap-16">
          {slides.map((slide, index) => (
            <div
              key={slide.id || index}
              ref={(el) => {
                slideRefs.current[index] = el;
                observe(el, index);
              }}
            >
              <AnimatedSlide index={index} isVisible={visibleSlides.has(index)}>
                <SlideRenderer
                  ref={(el) => { canvasRefs.current[index] = el; }}
                  slide={slide}
                  containerWidth={containerWidth}
                  isActive={currentSlide === index + 1}
                />
              </AnimatedSlide>
            </div>
          ))}
        </div>

        {/* End Card */}
        <EndCard
          shareData={shareData}
          onDownloadPdf={downloadPdf}
          isExporting={isExporting}
          exportProgress={exportProgress}
        />
      </main>

      {/* Scroll hint on first slide */}
      {currentSlide === 1 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 animate-bounce opacity-40">
          <ChevronDown className="w-6 h-6 text-white" />
        </div>
      )}
    </div>
  );
}

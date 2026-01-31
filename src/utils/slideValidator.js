// Slide Layout Validator
// Validates AI-generated slide layouts against canvas constraints and design rules

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 506;
const MIN_FONT_SIZE = 11;
const VALID_ELEMENT_TYPES = ['text', 'shape', 'image', 'video'];
const VALID_FONTS = ['Bebas Neue', 'Inter', 'JetBrains Mono'];
const VALID_ARCHETYPES = ['MONOLITH', 'SPLIT_WORLD', 'MAGAZINE_SPREAD', 'DASHBOARD'];

// Typography "middle zone" to avoid (per design rules)
const MIDDLE_ZONE_MIN = 24;
const MIDDLE_ZONE_MAX = 36;

// VALIDATE Red accent color
const ACCENT_COLOR = '#C41E3A';

/**
 * Validate a single slide
 * @param {Object} slide - Slide object with name, background, elements
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateSlide(slide) {
  const errors = [];
  const warnings = [];

  // Check slide has required properties
  if (!slide.name) {
    errors.push('Slide missing name property');
  }

  if (!slide.background) {
    warnings.push('Slide missing background property, will default to black');
  }

  if (!Array.isArray(slide.elements)) {
    errors.push('Slide elements must be an array');
    return { valid: false, errors, warnings };
  }

  // Check archetype if provided
  if (slide.archetype && !VALID_ARCHETYPES.includes(slide.archetype)) {
    warnings.push(`Unknown archetype: ${slide.archetype}`);
  }

  // Track accent color usage
  let accentElementCount = 0;
  const totalElements = slide.elements.length;

  // Validate each element
  for (let i = 0; i < slide.elements.length; i++) {
    const el = slide.elements[i];
    const prefix = `Element ${i}`;

    // Check element type
    if (!VALID_ELEMENT_TYPES.includes(el.type)) {
      errors.push(`${prefix}: Invalid type "${el.type}"`);
      continue;
    }

    // Check required positioning
    if (typeof el.x !== 'number' || typeof el.y !== 'number') {
      errors.push(`${prefix}: Missing x/y coordinates`);
    }

    if (typeof el.width !== 'number' || typeof el.height !== 'number') {
      errors.push(`${prefix}: Missing width/height`);
    }

    // Check canvas bounds (hard rule)
    if (el.x < 0) {
      errors.push(`${prefix}: x position ${el.x} is negative`);
    }
    if (el.y < 0) {
      errors.push(`${prefix}: y position ${el.y} is negative`);
    }
    if (el.x + el.width > CANVAS_WIDTH) {
      errors.push(`${prefix}: Element extends beyond canvas width (x:${el.x} + w:${el.width} > ${CANVAS_WIDTH})`);
    }
    if (el.y + el.height > CANVAS_HEIGHT) {
      errors.push(`${prefix}: Element extends beyond canvas height (y:${el.y} + h:${el.height} > ${CANVAS_HEIGHT})`);
    }

    // Text-specific validation
    if (el.type === 'text') {
      // Font size minimum (hard rule)
      if (el.fontSize && el.fontSize < MIN_FONT_SIZE) {
        errors.push(`${prefix}: Font size ${el.fontSize}px below minimum ${MIN_FONT_SIZE}px`);
      }

      // Typography middle zone (soft rule)
      if (el.fontSize && el.fontSize >= MIDDLE_ZONE_MIN && el.fontSize <= MIDDLE_ZONE_MAX) {
        warnings.push(`${prefix}: Font size ${el.fontSize}px in "middle zone" (${MIDDLE_ZONE_MIN}-${MIDDLE_ZONE_MAX}px). Go HUGE or tiny.`);
      }

      // Font family check (soft rule)
      if (el.fontFamily && !VALID_FONTS.includes(el.fontFamily)) {
        warnings.push(`${prefix}: Non-standard font "${el.fontFamily}". Allowed: ${VALID_FONTS.join(', ')}`);
      }

      // Content check
      if (!el.content && el.content !== '') {
        warnings.push(`${prefix}: Text element missing content`);
      }
    }

    // Shape-specific validation
    if (el.type === 'shape') {
      if (!el.shapeType) {
        warnings.push(`${prefix}: Shape missing shapeType, will default to rect`);
      }
      if (!el.color) {
        warnings.push(`${prefix}: Shape missing color`);
      }
    }

    // Image-specific validation
    if (el.type === 'image') {
      if (!el.src) {
        warnings.push(`${prefix}: Image element missing src`);
      }
    }

    // Track accent color usage
    if (el.color && el.color.toUpperCase() === ACCENT_COLOR) {
      accentElementCount++;
    }
  }

  // Check accent color ratio (soft rule - max 10%)
  if (totalElements > 0) {
    const accentRatio = accentElementCount / totalElements;
    if (accentRatio > 0.1) {
      warnings.push(`Accent color (#C41E3A) used in ${Math.round(accentRatio * 100)}% of elements. Keep under 10%.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate an entire proposal (array of slides)
 * @param {Array} slides - Array of slide objects
 * @returns {Array} Array of validation results for each slide
 */
export function validateProposal(slides) {
  if (!Array.isArray(slides)) {
    return [{ valid: false, errors: ['Proposal must have slides array'], warnings: [] }];
  }

  if (slides.length === 0) {
    return [{ valid: false, errors: ['Proposal has no slides'], warnings: [] }];
  }

  return slides.map((slide, index) => {
    const result = validateSlide(slide);
    result.slideIndex = index;
    result.slideName = slide.name || `Slide ${index + 1}`;
    return result;
  });
}

/**
 * Check if all slides in proposal are valid
 * @param {Array} validationResults - Results from validateProposal()
 * @returns {boolean}
 */
export function isProposalValid(validationResults) {
  return validationResults.every(r => r.valid);
}

/**
 * Get summary of all errors and warnings
 * @param {Array} validationResults - Results from validateProposal()
 * @returns {Object} { totalErrors, totalWarnings, errorDetails, warningDetails }
 */
export function getValidationSummary(validationResults) {
  const errorDetails = [];
  const warningDetails = [];

  for (const result of validationResults) {
    for (const error of result.errors) {
      errorDetails.push(`[${result.slideName}] ${error}`);
    }
    for (const warning of result.warnings) {
      warningDetails.push(`[${result.slideName}] ${warning}`);
    }
  }

  return {
    totalErrors: errorDetails.length,
    totalWarnings: warningDetails.length,
    errorDetails,
    warningDetails
  };
}

// textUtils.js
// Pulled out of textNode.js so the variable-parsing logic can be unit
// tested independently of React/rendering.

// Matches {{ variableName }} where variableName is a valid JS identifier
export const VARIABLE_REGEX = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g;

export const extractVariables = (text) => {
  if (!text) return [];
  const found = [];
  let match;
  const re = new RegExp(VARIABLE_REGEX);
  while ((match = re.exec(text)) !== null) {
    if (!found.includes(match[1])) found.push(match[1]);
  }
  return found;
};

// Measures rendered text width using an offscreen canvas so the TextNode
// can size itself to actual glyph widths instead of a "characters * magic
// number" guess (which is wrong for any non-monospace font, and especially
// wrong once variable-width fonts, emoji, or wide unicode text show up).
// Falls back to a char-count estimate in non-DOM environments (e.g. Jest/
// jsdom, which doesn't implement canvas 2D context).
let measureCanvas = null;

export const measureTextWidth = (text, font = '13px -apple-system, sans-serif') => {
  if (!text) return 0;
  // Non-browser / Jest jsdom fallback: avoid unhandled not-implemented warnings
  if (
    typeof window !== 'undefined' &&
    window.navigator &&
    window.navigator.userAgent &&
    window.navigator.userAgent.includes('jsdom')
  ) {
    return text.length * 7;
  }
  try {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
      return text.length * 7;
    }
    if (!measureCanvas) measureCanvas = document.createElement('canvas');
    if (!measureCanvas.getContext) return text.length * 7;
    const ctx = measureCanvas.getContext('2d');
    if (!ctx) return text.length * 7;
    ctx.font = font;
    return ctx.measureText(text).width;
  } catch {
    return text.length * 7;
  }
};

export const longestLineWidth = (text, font) =>
  text.split('\n').reduce((max, line) => Math.max(max, measureTextWidth(line, font)), 0);


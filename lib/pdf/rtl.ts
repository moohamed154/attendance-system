import { convertArabic } from 'arabic-reshaper';
import bidiFactory from 'bidi-js';

const bidi = bidiFactory();

/**
 * Checks if a string contains Arabic characters.
 */
export function hasArabic(text: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text.toString());
}

/**
 * Shapes Arabic glyphs into their connected presentation forms using arabic-reshaper.
 * It also uses bidi-js to get the correct visual order for left-to-right rendering 
 * engines like jsPDF's autotable.
 * 
 * Numbers and English text remain in their natural visual flow.
 */
export function pdfText(text: string | number | boolean | null | undefined, isArabic: boolean): string {
  if (text === null || text === undefined) return '';
  const str = text.toString();
  if (!isArabic || !str) return str;

  // 1. Shape glyphs (arabic-reshaper replaces isolated characters with connected forms)
  const reshaped = convertArabic(str);

  // 2. Get Visual Order (bidi-js handles RTL, LTR, and Numbers natively without manual reversal)
  try {
    const embeddingLevels = bidi.getEmbeddingLevels(reshaped, 'rtl');
    const visual = bidi.getVisualOrder(reshaped, embeddingLevels);
    
    let visualString = '';
    for (let i = 0; i < visual.length; i++) {
      visualString += reshaped[visual[i]];
    }
    return visualString;
  } catch (_e) {
    // Fallback if bidi-js fails
    return reshaped;
  }
}

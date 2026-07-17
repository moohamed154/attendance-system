import { jsPDF } from 'jspdf';

// Global cache for the font to prevent multiple base64 encodings and fetches
let cachedFontBase64: string | null = null;
let isFontLoaded = false;

/**
 * Loads the Noto Naskh Arabic font into the provided jsPDF instance.
 * Ensures the font is only fetched and base64 encoded once per session.
 */
export async function loadArabicFont(pdf: jsPDF): Promise<void> {
  if (!cachedFontBase64) {
    try {
      console.time('FontLoad');
      const res = await fetch('/fonts/NotoNaskhArabic-Regular.ttf');
      if (!res.ok) throw new Error('Failed to load font');
      const buffer = await res.arrayBuffer();
      cachedFontBase64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      console.timeEnd('FontLoad');
    } catch (e) {
      console.error('Error loading Arabic font:', e);
      return;
    }
  }

  if (cachedFontBase64) {
    pdf.addFileToVFS('NotoNaskhArabic-Regular.ttf', cachedFontBase64);
    pdf.addFont('NotoNaskhArabic-Regular.ttf', 'Amiri', 'normal');
    pdf.setFont('Amiri');
    isFontLoaded = true;
  }
}

export function hasArabicFontLoaded() {
  return isFontLoaded;
}

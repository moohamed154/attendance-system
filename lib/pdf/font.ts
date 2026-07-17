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
      console.log('[PDF Font] Fetching NotoNaskhArabic-Regular.ttf from /fonts/...');
      console.time('FontLoad');
      const res = await fetch('/fonts/NotoNaskhArabic-Regular.ttf');
      console.log(`[PDF Font] Fetch status: ${res.status} ${res.statusText}, ok: ${res.ok}`);
      
      if (!res.ok) throw new Error(`Failed to fetch font: ${res.status} ${res.statusText}`);
      
      const buffer = await res.arrayBuffer();
      console.log(`[PDF Font] Font buffer size: ${(buffer.byteLength / 1024).toFixed(2)} KB`);
      
      cachedFontBase64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      console.log(`[PDF Font] Base64 conversion successful.`);
      console.timeEnd('FontLoad');
    } catch (e) {
      console.error('[PDF Font Error] Failed to load Arabic font:', e);
      throw e; // Rethrow to fail the promise and let the toast catch it
    }
  } else {
    console.log('[PDF Font] Using cached font from memory.');
  }

  if (cachedFontBase64) {
    console.log('[PDF Font] Injecting font into jsPDF VFS...');
    pdf.addFileToVFS('NotoNaskhArabic-Regular.ttf', cachedFontBase64);
    pdf.addFont('NotoNaskhArabic-Regular.ttf', 'Amiri', 'normal');
    pdf.setFont('Amiri');
    isFontLoaded = true;
    console.log('[PDF Font] Font injection complete.');
  }
}

export function hasArabicFontLoaded() {
  return isFontLoaded;
}

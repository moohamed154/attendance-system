import { jsPDF } from 'jspdf';
import fs from 'fs';

async function runDiagnostics() {
  console.log("=== STARTING jsPDF FONT DIAGNOSTICS ===");
  const pdf = new jsPDF();
  
  try {
    const fontData = fs.readFileSync('public/fonts/Amiri-Regular.ttf');
    const base64 = fontData.toString('base64');
    
    console.log("1. Adding File to VFS...");
    pdf.addFileToVFS('Amiri-Regular.ttf', base64);
    
    if (typeof pdf.existsFileInVFS === 'function') {
      console.log("Exists in VFS:", pdf.existsFileInVFS('Amiri-Regular.ttf'));
    }
    
    console.log("\n2. Adding Font...");
    pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    console.log("Font List after addFont:");
    console.log(pdf.getFontList());
    
    console.log("\n3. Setting Font...");
    try {
      pdf.setFont('Amiri', 'normal');
      console.log("Internal getFont():");
      console.log(pdf.internal.getFont());
    } catch (err) {
      console.error("Failed to setFont:", err);
      console.log("Font list fallback:", pdf.getFontList());
    }
    
    console.log("\n6 & 7. Testing Output (Helvetica vs Custom Font)...");
    const testPdf1 = new jsPDF();
    testPdf1.text("Hello", 10, 10);
    console.log("Helvetica 'Hello' generated successfully.");
    
    const testPdf2 = new jsPDF();
    testPdf2.addFileToVFS('Amiri-Regular.ttf', base64);
    testPdf2.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    testPdf2.setFont('Amiri', 'normal');
    try {
      testPdf2.text("Hello", 10, 10);
      
      // Import the reshaping logic
      import('arabic-reshaper').then(({ convertArabic }) => {
        import('bidi-js').then(({ default: bidiFactory }) => {
          const bidi = bidiFactory();
          const reshaped = convertArabic('محمد أحمد');
          const levels = bidi.getEmbeddingLevels(reshaped, 'rtl');
          const visual = bidi.getVisualOrder(reshaped, levels);
          let visualString = '';
          for (let i = 0; i < visual.length; i++) {
            visualString += reshaped[visual[i]];
          }
          testPdf2.text(visualString, 100, 20, { isRTL: true });
          console.log("Custom Font 'Arabic' generated successfully.");
        });
      });
      
    } catch (err) {
      console.error("Failed to write text with Custom Font. Error:");
      console.error(err.stack);
    }
  } catch (err) {
    console.error("Fatal diagnostic error:", err);
  }
}

runDiagnostics();

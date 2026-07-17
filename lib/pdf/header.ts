import { jsPDF } from 'jspdf';
import { pdfText } from './rtl';

interface HeaderOptions {
  pdf: jsPDF;
  exportDict: any;
  isArabic: boolean;
  pageWidth: number;
  reportName: string;
}

/**
 * Draws the standardized report header on the PDF.
 * Includes System Name, Official Report title, Report Name, and timestamp.
 */
export function drawReportHeader({ pdf, exportDict, isArabic, pageWidth, reportName }: HeaderOptions): number {
  const align = isArabic ? 'right' : 'left';
  const startX = isArabic ? pageWidth - 14 : 14;
  let currentY = 20;

  // System Title (Logo Replacement)
  pdf.setFontSize(20);
  pdf.setTextColor(37, 99, 235);
  const systemName = pdfText(exportDict.systemName || "Attendance System", isArabic);
  pdf.text(systemName, startX, currentY, { align, isRTL: isArabic } as any);
  currentY += 8;
  
  // Subtitle / Center details
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128);
  const generatedDate = new Date().toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  
  const subtitle = pdfText(`${exportDict.officialReport || "Official Center Report"} - ${generatedDate}`, isArabic);
  pdf.text(subtitle, startX, currentY, { align, isRTL: isArabic } as any);
  currentY += 6;

  // Divider Line
  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(0.5);
  pdf.line(14, currentY, pageWidth - 14, currentY);
  currentY += 10;

  // Report Specific Title
  pdf.setFontSize(15);
  pdf.setTextColor(17, 17, 17);
  pdf.text(pdfText(reportName, isArabic), startX, currentY, { align, isRTL: isArabic } as any);
  
  return currentY + 4; // Return the Y position where tables should start
}

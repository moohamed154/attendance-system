'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { convertArabic } from 'arabic-reshaper';
import { toast } from 'sonner';

interface ExportRow {
  [key: string]: string | number | boolean | null | undefined;
}

// Check if text contains Arabic characters
function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

// Reshape and reverse Arabic text for jsPDF rendering
function processArabicText(text: string): string {
  if (!text) return '';
  const reshaped = convertArabic(text);
  return reshaped.split('').reverse().join('');
}

// Process text: reshape Arabic if needed, pass through otherwise
function pdfText(text: string, isArabic: boolean): string {
  if (!isArabic || !text) return text || '';
  return processArabicText(text);
}

async function loadArabicFont(pdf: jsPDF) {
  const res = await fetch('/fonts/Amiri-Regular.ttf');
  const buffer = await res.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  pdf.addFileToVFS('Amiri-Regular.ttf', base64);
  pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  pdf.setFont('Amiri');
}

export function ExportButton({ data, paymentData, dict, currency }: { data: ExportRow[], paymentData?: ExportRow[], dict: any, currency?: string }) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const exportDict = dict?.reportsPage?.export || {};
  const currencySymbol = currency || exportDict.egp || "EGP";
  
  const isArabic = document.documentElement.dir === 'rtl' || dict?.attendancePage?.title === "سجل الحضور" || dict?.reportsPage?.title === "التقارير والتحليلات";

  const exportXLSX = async () => {
    setIsExportingExcel(true);
    const promise = new Promise<void>((resolve, reject) => {
      try {
        const wb = XLSX.utils.book_new();
        
        const localizedData = data.map(row => {
          const newRow: ExportRow = {};
          Object.keys(row).forEach(key => {
            const val = row[key];
            if (val === "PRESENT" || val === "Present") newRow[key] = exportDict.present || "Present";
            else if (val === "ABSENT" || val === "Absent") newRow[key] = exportDict.absent || "Absent";
            else if (val === "LATE" || val === "Late") newRow[key] = exportDict.late || "Late";
            else if (typeof val === 'boolean') newRow[key] = val ? (exportDict.yes || 'Yes') : (exportDict.no || 'No');
            else newRow[key] = val;
          });
          return newRow;
        });

        const ws = XLSX.utils.json_to_sheet(localizedData);
        XLSX.utils.book_append_sheet(wb, ws, exportDict.sheetName || "Report");

        if (paymentData && paymentData.length > 0) {
          const ws2 = XLSX.utils.json_to_sheet(paymentData);
          XLSX.utils.book_append_sheet(wb, ws2, "Payments");
        }

        XLSX.writeFile(wb, "center_report.xlsx");
        resolve();
      } catch (error) {
        console.error("Excel Export Error: ", error);
        reject(error);
      } finally {
        setIsExportingExcel(false);
      }
    });

    toast.promise(promise, {
      loading: dict?.general?.loading || 'Exporting...',
      success: dict?.general?.success || 'Exported successfully',
      error: dict?.general?.error || 'Export failed',
    });
  };

  const exportPDF = async () => {
    setIsExportingPdf(true);
    const promise = new Promise<void>(async (resolve, reject) => {
      try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();

      // Load Arabic font if needed
      if (isArabic) {
        await loadArabicFont(pdf);
      }
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      const title = pdfText(exportDict.systemName || "Attendance System", isArabic);
      pdf.text(title, pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      const subtitle = pdfText(exportDict.officialReport || "Official Center Report", isArabic);
      pdf.text(subtitle, pageWidth / 2, 28, { align: 'center' });

      // Divider
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(0.5);
      pdf.line(14, 32, pageWidth - 14, 32);

      // Attendance Table
      pdf.setFontSize(14);
      pdf.setTextColor(17, 17, 17);
      pdf.text(pdfText(exportDict.attendancePdfTitle || "Attendance Report", isArabic), pageWidth / 2, 42, { align: 'center' });

      const attendanceHead = [
        pdfText(exportDict.date || "Date", isArabic),
        pdfText(exportDict.present || "Present", isArabic),
        pdfText(exportDict.absent || "Absent", isArabic),
        pdfText(exportDict.late || "Late", isArabic)
      ];

      const attendanceBody = data.map(row => [
        row.date?.toString() || '',
        row.PRESENT?.toString() || '0',
        row.ABSENT?.toString() || '0',
        row.LATE?.toString() || '0'
      ]);

      const fontName = isArabic ? 'Amiri' : 'helvetica';

      autoTable(pdf, {
        startY: 46,
        head: [attendanceHead],
        body: attendanceBody,
        theme: 'grid',
        styles: {
          font: fontName,
          halign: 'center',
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: 'normal',
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        columnStyles: {
          1: { textColor: [16, 185, 129] },
          2: { textColor: [239, 68, 68] },
          3: { textColor: [245, 158, 11] },
        },
        margin: { left: 14, right: 14 },
      });

      // Payments Table
      if (paymentData && paymentData.length > 0) {
        const lastY = (pdf as any).lastAutoTable?.finalY || 120;
        
        pdf.setFontSize(14);
        pdf.setTextColor(17, 17, 17);
        pdf.text(pdfText(exportDict.paymentsPdfTitle || "Payments Report", isArabic), pageWidth / 2, lastY + 14, { align: 'center' });

        const paymentsHead = [
          pdfText(exportDict.date || "Date", isArabic),
          pdfText(`${exportDict.revenue || "Revenue"} (${currencySymbol})`, isArabic)
        ];

        const paymentsBody = paymentData.map(row => {
          const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthIndex = MONTHS_EN.indexOf(row.date as string) + 1;
          const localizedMonth = monthIndex > 0 ? (dict?.paymentsPage?.months?.[monthIndex.toString()] || row.date) : row.date;
          return [
            localizedMonth?.toString() || row.date?.toString() || '',
            `${row.Revenue?.toString() || '0'} ${currencySymbol}`
          ];
        });

        autoTable(pdf, {
          startY: lastY + 18,
          head: [paymentsHead],
          body: paymentsBody,
          theme: 'grid',
          styles: {
            font: fontName,
            halign: 'center',
          },
          headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontStyle: 'normal',
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250],
          },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text(pdfText(exportDict.generatedBy || "Generated by Attendance System", isArabic), 14, pageHeight - 10);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, pageHeight - 10, { align: 'right' });

        pdf.save("center_report.pdf");
        resolve();
      } catch (error) {
        console.error("PDF Export Error: ", error);
        reject(error);
      } finally {
        setIsExportingPdf(false);
      }
    });

    toast.promise(promise, {
      loading: dict?.general?.loading || 'Exporting...',
      success: dict?.general?.success || 'Exported successfully',
      error: dict?.general?.error || 'Export failed',
    });
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button variant="outline" className="rounded-xl" onClick={exportXLSX} disabled={isExportingExcel || isExportingPdf}>
        {isExportingExcel ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
        {dict?.reportsPage?.exportExcel || "Export Excel"}
      </Button>
      <Button variant="outline" className="rounded-xl" onClick={exportPDF} disabled={isExportingExcel || isExportingPdf}>
        {isExportingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
        {dict?.reportsPage?.exportPdf || "Export PDF"}
      </Button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { loadArabicFont, pdfText, drawReportHeader, drawReportFooters, getStandardTableConfig } from '@/lib/pdf';

interface ExportRow {
  [key: string]: string | number | boolean | null | undefined;
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
      
      const fontName = isArabic ? 'Amiri' : 'helvetica';

      const currentY = drawReportHeader({
        pdf,
        exportDict,
        isArabic,
        pageWidth,
        reportName: exportDict.attendancePdfTitle || "Attendance Report"
      });

      const attendanceHead = [
        pdfText(exportDict.date || "Date", isArabic),
        pdfText(exportDict.present || "Present", isArabic),
        pdfText(exportDict.absent || "Absent", isArabic),
        pdfText(exportDict.late || "Late", isArabic)
      ];

      const attendanceBody = data.map(row => [
        pdfText(row.date, isArabic),
        pdfText(row.PRESENT || '0', isArabic),
        pdfText(row.ABSENT || '0', isArabic),
        pdfText(row.LATE || '0', isArabic)
      ]);

      const tableConfig = getStandardTableConfig({
        isArabic,
        startY: currentY + 4,
        head: [attendanceHead],
        body: attendanceBody,
        fontName
      });

      // Override some styles specifically for attendance table colors
      tableConfig.columnStyles = {
        [isArabic ? 2 : 1]: { textColor: [16, 185, 129] },
        [isArabic ? 1 : 2]: { textColor: [239, 68, 68] },
        [isArabic ? 0 : 3]: { textColor: [245, 158, 11] },
      };

      autoTable(pdf, tableConfig);

      // Payments Table
      if (paymentData && paymentData.length > 0) {
        const lastY = (pdf as any).lastAutoTable?.finalY || 120;
        
        pdf.setFontSize(15);
        pdf.setTextColor(17, 17, 17);
        const align = isArabic ? 'right' : 'left';
        const startX = isArabic ? pageWidth - 14 : 14;
        pdf.text(pdfText(exportDict.paymentsPdfTitle || "Payments Report", isArabic), startX, lastY + 14, { align, isRTL: isArabic } as any);

        const paymentsHead = [
          pdfText(exportDict.date || "Date", isArabic),
          pdfText(`${exportDict.revenue || "Revenue"} (${currencySymbol})`, isArabic)
        ];

        const paymentsBody = paymentData.map(row => {
          const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthIndex = MONTHS_EN.indexOf(row.date as string) + 1;
          const localizedMonth = monthIndex > 0 ? (dict?.paymentsPage?.months?.[monthIndex.toString()] || row.date) : row.date;
          return [
            pdfText(localizedMonth, isArabic),
            pdfText(`${row.Revenue || '0'} ${currencySymbol}`, isArabic)
          ];
        });

        autoTable(pdf, getStandardTableConfig({
          isArabic,
          startY: lastY + 18,
          head: [paymentsHead],
          body: paymentsBody,
          fontName
        }));
      }

      const pageHeight = pdf.internal.pageSize.getHeight();
      drawReportFooters({ pdf, exportDict, isArabic, pageWidth, pageHeight });

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

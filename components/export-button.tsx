'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportRow {
  [key: string]: string | number | boolean | null | undefined;
}

export function ExportButton({ data, paymentData, dict, currency }: { data: ExportRow[], paymentData?: ExportRow[], dict: any, currency?: string }) {
  const exportDict = dict?.reportsPage?.export || {};
  const currencySymbol = currency || exportDict.egp || "EGP";
  
  const isArabic = dict?.reportsPage?.title === "التقارير والتحليلات";

  const exportXLSX = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, exportDict.attendanceSheet || "Attendance");
      
      if (paymentData && paymentData.length > 0) {
        const localizedPayments = paymentData.map(item => {
          const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthIndex = MONTHS_EN.indexOf(item.month as string) + 1;
          const localizedMonth = monthIndex > 0 ? (dict?.paymentsPage?.months?.[monthIndex.toString()] || item.month) : item.month;
          return {
            [exportDict.month || "Month"]: localizedMonth,
            [exportDict.collected || "Collected"]: item.PAID,
            [exportDict.pending || "Pending"]: item.UNPAID
          };
        });
        const wsPayments = XLSX.utils.json_to_sheet(localizedPayments);
        let sheetName = exportDict.paymentsSheet || "Payments";
        if (sheetName.length > 31) sheetName = sheetName.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, wsPayments, sheetName);
      }

      XLSX.writeFile(wb, "center_report.xlsx");
    } catch (error) {
      console.error("Excel Export Error: ", error);
    }
  };

  const exportPDF = () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235); // blue
      const title = exportDict.systemName || "Attendance System";
      pdf.text(title, pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128); // gray
      const subtitle = exportDict.officialReport || "Official Center Report";
      pdf.text(subtitle, pageWidth / 2, 28, { align: 'center' });

      // Divider
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(0.5);
      pdf.line(14, 32, pageWidth - 14, 32);

      // Attendance Table
      pdf.setFontSize(14);
      pdf.setTextColor(17, 17, 17);
      pdf.text(exportDict.attendancePdfTitle || "Attendance Report", pageWidth / 2, 42, { align: 'center' });

      const attendanceHead = [
        exportDict.date || "Date",
        exportDict.present || "Present",
        exportDict.absent || "Absent",
        exportDict.late || "Late"
      ];

      const attendanceBody = data.map(row => [
        row.date?.toString() || '',
        row.PRESENT?.toString() || '0',
        row.ABSENT?.toString() || '0',
        row.LATE?.toString() || '0'
      ]);

      autoTable(pdf, {
        startY: 46,
        head: [attendanceHead],
        body: attendanceBody,
        theme: 'grid',
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        columnStyles: {
          1: { textColor: [16, 185, 129] },  // green for present
          2: { textColor: [239, 68, 68] },    // red for absent
          3: { textColor: [245, 158, 11] },   // amber for late
        },
        margin: { left: 14, right: 14 },
      });

      // Payments Table (if data exists)
      if (paymentData && paymentData.length > 0) {
        const lastY = (pdf as any).lastAutoTable?.finalY || 120;
        
        pdf.setFontSize(14);
        pdf.setTextColor(17, 17, 17);
        pdf.text(exportDict.paymentsPdfTitle || "Payments Report", pageWidth / 2, lastY + 14, { align: 'center' });

        const paymentsHead = [
          exportDict.date || "Date",
          `${exportDict.revenue || "Revenue"} (${currencySymbol})`
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
          headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
          },
          bodyStyles: {
            halign: 'center',
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
      pdf.text(exportDict.generatedBy || "Generated by Attendance System", 14, pageHeight - 10);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, pageHeight - 10, { align: 'right' });

      pdf.save("center_report.pdf");
    } catch (error) {
      console.error("PDF Export Error: ", error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button variant="outline" className="rounded-xl" onClick={exportXLSX}>
        <Download className="w-4 h-4 mr-2" /> {dict?.reportsPage?.exportExcel || "Export Excel"}
      </Button>
      <Button variant="outline" className="rounded-xl" onClick={exportPDF}>
        <Download className="w-4 h-4 mr-2" /> {dict?.reportsPage?.exportPdf || "Export PDF"}
      </Button>
    </div>
  );
}

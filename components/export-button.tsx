'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

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
        console.log('[PDF Export] Starting PDF generation via Playwright API...');
        
        const response = await fetch('/api/pdf/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'reports',
            data: {
              attendance: data,
              payments: paymentData,
              dict: exportDict,
              currency: currencySymbol
            },
            config: {
              title: exportDict.attendancePdfTitle || "Attendance Report",
              isRtl: isArabic,
              filename: isArabic ? 'تقرير_المركز.pdf' : 'center_report.pdf'
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to generate PDF');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = isArabic ? 'تقرير_المركز.pdf' : 'center_report.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        resolve();
      } catch (error: any) {
        console.error('PDF Export Error:', error);
        reject(error);
      } finally {
        setIsExportingPdf(false);
      }
    });

    toast.promise(promise, {
      loading: dict?.general?.loading || 'Exporting PDF...',
      success: dict?.general?.success || 'PDF exported successfully',
      error: (err: any) => err.message || dict?.general?.error || 'PDF export failed',
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

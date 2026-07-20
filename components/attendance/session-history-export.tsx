'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';

export function SessionHistoryExport({ attendances, session, date, dict }: any) {
  const isArabic = dict?.nav?.today === "اليوم";
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const exportXLSX = async () => {
    setIsExportingExcel(true);
    const promise = new Promise<void>(async (resolve, reject) => {
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        
        const localizedData = attendances.map((a: any) => ({
          [dict.historyPage.studentColumns.id]: a.student.studentId,
          [dict.historyPage.studentColumns.name]: a.student.name,
          [dict.historyPage.studentColumns.status]: dict.historyPage.status[a.status.toLowerCase() as keyof typeof dict.historyPage.status],
          [dict.historyPage.studentColumns.recordedAt]: dayjs(a.updatedAt).format('h:mm A'),
        }));

        const ws = XLSX.utils.json_to_sheet(localizedData);
        XLSX.utils.book_append_sheet(wb, ws, "Session History");
        XLSX.writeFile(wb, `session_history_${session.grade}_${dayjs(date).format('YYYY-MM-DD')}.xlsx`);
        resolve();
      } catch (error) {
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
        const response = await fetch('/api/pdf/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'session-history',
            data: {
              attendances,
              session,
              date: dayjs(date).format('YYYY-MM-DD'),
              dict
            },
            config: {
              title: `${dict.historyPage.title} - ${session.grade}`,
              isRtl: isArabic,
              filename: `session_history_${session.grade}_${dayjs(date).format('YYYY-MM-DD')}.pdf`
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
        a.download = `session_history_${session.grade}_${dayjs(date).format('YYYY-MM-DD')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        resolve();
      } catch (error) {
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
      <Button variant="outline" size="sm" onClick={exportXLSX} className="rounded-xl" disabled={isExportingExcel || isExportingPdf}>
        {isExportingExcel ? <Loader2 className="w-4 h-4 rtl:ml-2 ltr:mr-2 animate-spin" /> : <Download className="w-4 h-4 rtl:ml-2 ltr:mr-2" />}
        {dict.historyPage.exportExcel}
      </Button>
      <Button variant="outline" size="sm" onClick={exportPDF} className="rounded-xl" disabled={isExportingExcel || isExportingPdf}>
        {isExportingPdf ? <Loader2 className="w-4 h-4 rtl:ml-2 ltr:mr-2 animate-spin" /> : <Download className="w-4 h-4 rtl:ml-2 ltr:mr-2" />}
        {dict.historyPage.exportPdf}
      </Button>
    </div>
  );
}

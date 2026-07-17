'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export function SessionHistoryExport({ attendances, session, date, dict }: any) {
  const exportXLSX = () => {
    try {
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
    } catch (error) {
      console.error(error);
    }
  };

  const exportPDF = async () => {
    const el = document.getElementById("session-pdf-export");
    if (!el) return;

    el.style.display = 'block';
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    el.style.top = '0';

    // Wait for browser layout to be calculated
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("Rendered canvas is empty.");
      }
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`session_history_${session.grade}_${dayjs(date).format('YYYY-MM-DD')}.pdf`);
    } catch (error) {
      console.error("PDF Export Error: ", error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      el.style.display = 'none';
      el.style.position = '';
      el.style.left = '';
      el.style.top = '';
    }
  };

  return (
    <>

      
      <div className="flex items-center gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={exportXLSX} className="rounded-xl">
          <Download className="w-4 h-4 rtl:ml-2 ltr:mr-2" />
          {dict.historyPage.exportExcel}
        </Button>
        <Button variant="outline" size="sm" onClick={exportPDF} className="rounded-xl">
          <Download className="w-4 h-4 rtl:ml-2 ltr:mr-2" />
          {dict.historyPage.exportPdf}
        </Button>
      </div>

      <div id="session-pdf-export" style={{ display: 'none', width: '800px', fontFamily: 'sans-serif', padding: '32px', backgroundColor: '#ffffff', color: '#000000' }} dir={dict.nav.today === "اليوم" ? "rtl" : "ltr"}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          {dict.historyPage.sessionDetails}
        </h2>
        <p style={{ marginBottom: '20px', color: '#555' }}>
          {dayjs(date).format('MMMM D, YYYY')} • {session.grade} • {session.time}
        </p>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', backgroundColor: '#f9f9f9' }}>
              <th style={{ textAlign: 'start', padding: '10px', border: '1px solid #ddd' }}>{dict.historyPage.studentColumns.id}</th>
              <th style={{ textAlign: 'start', padding: '10px', border: '1px solid #ddd' }}>{dict.historyPage.studentColumns.name}</th>
              <th style={{ textAlign: 'start', padding: '10px', border: '1px solid #ddd' }}>{dict.historyPage.studentColumns.status}</th>
              <th style={{ textAlign: 'start', padding: '10px', border: '1px solid #ddd' }}>{dict.historyPage.studentColumns.recordedAt}</th>
            </tr>
          </thead>
          <tbody>
            {attendances.map((a: any) => (
              <tr key={a.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{a.student.studentId}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{a.student.name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {dict.historyPage.status[a.status.toLowerCase() as keyof typeof dict.historyPage.status]}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{dayjs(a.updatedAt).format('h:mm A')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Dictionary } from '@/lib/i18n';

interface ExportRow {
  [key: string]: string | number | boolean | null | undefined;
}

export function ExportButton({ data, paymentData, dict, currency }: { data: ExportRow[], paymentData?: ExportRow[], dict: any, currency?: string }) {
  const exportDict = dict?.reportsPage?.export || {};
  const currencySymbol = currency || exportDict.egp || "EGP";
  
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
        // Sometimes sheet names > 31 chars throw errors in XLSX
        let sheetName = exportDict.paymentsSheet || "Payments";
        if (sheetName.length > 31) sheetName = sheetName.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, wsPayments, sheetName);
      }

      XLSX.writeFile(wb, "center_report.xlsx");
    } catch (error) {
      console.error("Excel Export Error: ", error);
      alert("Failed to export Excel. Please check the console for details.");
    }
  };

  const exportPDF = async () => {
    const el = document.getElementById("pdf-export-content");
    if (!el) return;

    // Make it visible offscreen to capture
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
      pdf.save("center_report.pdf");
    } catch (error) {
      console.error("PDF Export Error: ", error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Hide it again
      el.style.display = 'none';
      el.style.position = '';
      el.style.left = '';
      el.style.top = '';
    }
  };

  return (
    <>


      <div className="flex items-center gap-2 print:hidden">
        <Button variant="outline" className="rounded-xl" onClick={exportXLSX}>
          <Download className="w-4 h-4 mr-2" /> {dict?.reportsPage?.exportExcel || "Export Excel"}
        </Button>
        <Button variant="outline" className="rounded-xl" onClick={exportPDF}>
          <Download className="w-4 h-4 mr-2" /> {dict?.reportsPage?.exportPdf || "Export PDF"}
        </Button>
      </div>

      {/* Off-screen DOM element for PDF generation — uses ONLY inline styles (no Tailwind) to avoid html2canvas lab() color crash */}
      <div id="pdf-export-content" style={{ display: 'none', width: '800px', fontFamily: 'sans-serif', padding: '32px', backgroundColor: '#ffffff', color: '#000000', position: 'relative', minHeight: '1122px' }} dir={dict?.reportsPage?.title === "التقارير والتحليلات" ? "rtl" : "ltr"}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #2563eb', paddingBottom: '24px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>{exportDict.systemName || "Attendance System"}</h1>
            <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px', fontWeight: '500' }}>{exportDict.officialReport || "Official Center Report"}</p>
          </div>
          <div style={{ width: '64px', height: '64px', backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>AS</span>
          </div>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: '#111' }}>
          {exportDict.attendancePdfTitle || "Attendance Report"}
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', backgroundColor: '#f8f9fa' }}>
              <th style={{ textAlign: 'start', padding: '12px 8px', fontWeight: 'bold', color: '#444' }}>{exportDict.date || "Date"}</th>
              <th style={{ textAlign: 'start', padding: '12px 8px', fontWeight: 'bold', color: '#444' }}>{exportDict.present || "Present"}</th>
              <th style={{ textAlign: 'start', padding: '12px 8px', fontWeight: 'bold', color: '#444' }}>{exportDict.absent || "Absent"}</th>
              <th style={{ textAlign: 'start', padding: '12px 8px', fontWeight: 'bold', color: '#444' }}>{exportDict.late || "Late"}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 8px' }}>{row.date?.toString() || ''}</td>
                <td style={{ padding: '12px 8px', color: '#10b981', fontWeight: '500' }}>{row.PRESENT}</td>
                <td style={{ padding: '12px 8px', color: '#ef4444', fontWeight: '500' }}>{row.ABSENT}</td>
                <td style={{ padding: '12px 8px', color: '#f59e0b', fontWeight: '500' }}>{row.LATE}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {paymentData && paymentData.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px', color: '#111' }}>
              {exportDict.paymentsPdfTitle || "Payments Report"}
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '60px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ccc', backgroundColor: '#f8f9fa' }}>
                  <th style={{ textAlign: 'start', padding: '12px 8px', fontWeight: 'bold', color: '#444' }}>{exportDict.month || "Month"}</th>
                  <th style={{ textAlign: 'start', padding: '12px 8px', fontWeight: 'bold', color: '#444' }}>{exportDict.revenue || "Revenue"}</th>
                </tr>
              </thead>
              <tbody>
                {paymentData.map((row, i) => {
                  const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const monthIndex = MONTHS_EN.indexOf(row.date as string) + 1;
                  const localizedMonth = monthIndex > 0 ? (dict?.paymentsPage?.months?.[monthIndex.toString()] || row.date) : row.date;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px 8px' }}>{localizedMonth?.toString() || row.date}</td>
                      <td style={{ padding: '12px 8px', color: '#10b981', fontWeight: '500' }}>{row.Revenue} {currencySymbol}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: '32px', left: '32px', right: '32px', borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6b7280' }}>
          <div>{exportDict.generatedBy || "Generated by Attendance System"}</div>
          <div>Date: {new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </>
  );
}

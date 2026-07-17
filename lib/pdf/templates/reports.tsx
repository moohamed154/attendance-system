import React from 'react';
import { PdfHeader } from './header';

interface ExportRow {
  [key: string]: string | number | boolean | null | undefined;
}

interface ReportsTemplateProps {
  data: {
    attendance: ExportRow[];
    payments?: ExportRow[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dict: any;
    currency: string;
  };
}

export function ReportsTemplate({ data }: ReportsTemplateProps) {
  const { attendance, payments, dict, currency } = data;

  return (
    <div>
      <PdfHeader reportTitle={dict.attendancePdfTitle || "Attendance Report"} />

      <table className="w-full text-sm text-left rtl:text-right border-collapse border border-gray-300 mb-8 mt-4">
        <thead className="bg-blue-600 text-white font-bold">
          <tr>
            <th className="border border-gray-300 px-4 py-2">{dict.date || "Date"}</th>
            <th className="border border-gray-300 px-4 py-2">{dict.present || "Present"}</th>
            <th className="border border-gray-300 px-4 py-2">{dict.absent || "Absent"}</th>
            <th className="border border-gray-300 px-4 py-2">{dict.late || "Late"}</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="border border-gray-300 px-4 py-2">{String(row.date)}</td>
              <td className="border border-gray-300 px-4 py-2 text-emerald-600 font-semibold">{String(row.present || row.PRESENT || 0)}</td>
              <td className="border border-gray-300 px-4 py-2 text-red-500 font-semibold">{String(row.absent || row.ABSENT || 0)}</td>
              <td className="border border-gray-300 px-4 py-2 text-amber-500 font-semibold">{String(row.late || row.LATE || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {payments && payments.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-gray-800 mt-12 mb-4">
            {dict.paymentsPdfTitle || "Payments Report"}
          </h2>
          <table className="w-full text-sm text-left rtl:text-right border-collapse border border-gray-300">
            <thead className="bg-blue-600 text-white font-bold">
              <tr>
                <th className="border border-gray-300 px-4 py-2">{dict.date || "Date"}</th>
                <th className="border border-gray-300 px-4 py-2">{`${dict.revenue || "Revenue"} (${currency})`}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-300 px-4 py-2">{String(row.date)}</td>
                  <td className="border border-gray-300 px-4 py-2">{`${row.amount || row.Revenue || 0} ${currency}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

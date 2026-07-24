import React from 'react';
import { PdfHeader } from './header';

interface SessionHistoryTemplateProps {
  data: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attendances: any[];
    session: { grade: string; time: string };
    date: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dict: any;
  };
}

export function SessionHistoryTemplate({ data }: SessionHistoryTemplateProps) {
  const { attendances, session, date, dict, centerSettings } = data as any;
  const isRtl = true;
  const centerName = centerSettings ? (isRtl ? centerSettings.centerNameAr : centerSettings.centerNameEn) || centerSettings.centerName : undefined;

  return (
    <div>
      <PdfHeader 
        centerName={centerName}
        centerLogo={centerSettings?.centerLogo}
        centerAddress={centerSettings?.centerAddress}
        centerPhone={centerSettings?.centerPhone}
        centerEmail={centerSettings?.centerEmail}
        reportTitle={`${dict?.historyPage?.title || 'Session History'} - ${session.grade}`} 
        filters={[
          { label: "Date", value: date },
          { label: "Time", value: session.time }
        ]}
      />

      <table className="w-full text-sm text-left rtl:text-right border-collapse border border-gray-300">
        <thead className="bg-blue-600 text-white font-bold">
          <tr>
            <th className="border border-gray-300 px-4 py-2">{dict.historyPage.studentColumns.id || "ID"}</th>
            <th className="border border-gray-300 px-4 py-2">{dict.historyPage.studentColumns.name || "Name"}</th>
            <th className="border border-gray-300 px-4 py-2">{dict.historyPage.studentColumns.status || "Status"}</th>
            <th className="border border-gray-300 px-4 py-2">{dict.historyPage.studentColumns.recordedAt || "Recorded At"}</th>
          </tr>
        </thead>
        <tbody>
          {attendances.map((a: any, i: number) => {
            const statusText = dict.historyPage.status[a.status.toLowerCase()] || a.status;
            let statusColor = "text-gray-900";
            if (a.status === 'PRESENT') statusColor = "text-emerald-600 font-semibold";
            if (a.status === 'ABSENT') statusColor = "text-red-500 font-semibold";
            if (a.status === 'LATE') statusColor = "text-amber-500 font-semibold";

            return (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 px-4 py-2">{a.student.studentId}</td>
                <td className="border border-gray-300 px-4 py-2 font-medium">{a.student.name}</td>
                <td className={`border border-gray-300 px-4 py-2 ${statusColor}`}>{statusText}</td>
                <td className="border border-gray-300 px-4 py-2 text-gray-600">{new Date(a.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

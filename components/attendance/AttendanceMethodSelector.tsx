'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AttendanceMethodCard } from './AttendanceMethodCard';
import { UserCheck, QrCode, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface AttendanceMethodSelectorProps {
  sessionId: string;
  gradeName: string;
  formattedTime: string;
  dayName: string;
  dict: any;
}

export function AttendanceMethodSelector({
  sessionId,
  gradeName,
  formattedTime,
  dayName,
  dict
}: AttendanceMethodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const m = dict.attendanceMode || {};

  const handleSelectManual = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', 'manual');
    router.push(`/dashboard/attendance/${sessionId}?${params.toString()}`);
  };

  const handleSelectQR = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', 'qr');
    router.push(`/dashboard/attendance/${sessionId}?${params.toString()}`);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full w-10 h-10 border border-border bg-card shadow-sm hover:bg-muted/50 transition-colors">
          <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {gradeName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {dayName} • {formattedTime}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <AttendanceMethodCard
          title={m.manualTitle || "Manual Attendance"}
          description={m.manualDesc || "Mark student attendance list manually with status buttons."}
          icon={<UserCheck className="w-6 h-6" />}
          badgeText={m.manualBadge || "Standard"}
          onClick={handleSelectManual}
          buttonText={m.startManual || "Start Manual Mode"}
          testId="select-mode-manual"
        />

        <AttendanceMethodCard
          title={m.qrTitle || "QR Code Scanner"}
          description={m.qrDesc || "Scan student QR codes for rapid automatic check-in."}
          icon={<QrCode className="w-6 h-6" />}
          badgeText={m.qrBadge || "Fast"}
          onClick={handleSelectQR}
          buttonText={m.startQR || "Start QR Scanner"}
          variant="outline"
          testId="select-mode-qr"
        />
      </div>
    </div>
  );
}

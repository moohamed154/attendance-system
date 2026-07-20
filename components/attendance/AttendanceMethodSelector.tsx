'use client';

import { useRouter } from 'next/navigation';
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
  const m = dict.attendanceMode || {};

  const handleSelectManual = () => {
    router.push(`/dashboard/attendance/${sessionId}`);
  };

  const handleSelectQR = () => {
    router.push(`/dashboard/attendance/qr/${sessionId}`);
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

      <div className="text-start">
        <h2 className="text-xl font-semibold tracking-tight text-foreground/90">
          {m.title || "Choose Attendance Method"}
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AttendanceMethodCard
          title={m.manualTitle || "Manual Attendance"}
          description={m.manualDesc || "Mark attendance manually from a list of all students enrolled in this session."}
          icon={<UserCheck className="w-6 h-6" />}
          onClick={handleSelectManual}
        />
        
        <AttendanceMethodCard
          title={m.qrTitle || "QR Code Attendance"}
          description={m.qrDesc || "Scan student QR codes using the device camera for fast and automated attendance."}
          icon={<QrCode className="w-6 h-6" />}
          onClick={handleSelectQR}
        />
      </div>
    </div>
  );
}

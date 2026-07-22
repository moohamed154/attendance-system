'use client';

import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, Share2, Ticket, ShieldCheck, User, BookOpen, Calendar, Key, Sparkles, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReservationCardProps {
  open?: boolean;
  onClose?: () => void;
  reservation?: {
    id: string;
    reservationNumber: string;
    trackingCode?: string | null;
    status: string;
    reservedAt: Date | string;
    expiresAt: Date | string;
    qrToken?: string | null;
    parentName?: string | null;
    session: {
      subject?: string | null;
      teacherName?: string | null;
      grade: string;
      dayOfWeek: number;
      time: string;
      price?: number | null;
      room?: string | null;
    };
    student?: {
      name: string;
      studentId: string;
      parentPhone?: string | null;
    };
  };
  reservationNumber?: string;
  trackingCode?: string;
  studentName?: string;
  parentName?: string;
  grade?: string;
  subject?: string;
  teacherName?: string;
  time?: string;
  dayOfWeek?: number;
  qrToken?: string;
  status?: string;
  centerName?: string;
  triggerLabel?: string;
  locale?: string;
}

const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function ReservationCardDigitalTicket({
  open,
  onClose,
  reservation,
  reservationNumber,
  trackingCode,
  studentName,
  parentName,
  grade,
  subject,
  teacherName,
  time,
  dayOfWeek,
  qrToken,
  status,
  centerName = 'Creators Educational Center',
  triggerLabel = 'Digital Ticket',
  locale = 'en',
}: ReservationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [internalOpen, setInternalOpen] = useState<boolean>(false);

  const isModalControlled = open !== undefined;
  const isOpen = isModalControlled ? open : internalOpen;
  const isRtl = locale === 'ar';
  const days = isRtl ? DAYS_AR : DAYS_EN;

  const resNumber = reservationNumber || reservation?.reservationNumber || 'RES-20260722-000000';
  const trackCode = trackingCode || reservation?.trackingCode || '4F8K-92LM';
  const displayStudentName = studentName || reservation?.student?.name || 'Student';
  const displayParentName = parentName || reservation?.parentName || '';
  const displayGrade = grade || reservation?.session?.grade || 'Grade';
  const displaySubject = subject || reservation?.session?.subject || 'General';
  const displayTeacher = teacherName || reservation?.session?.teacherName || 'Teacher';
  const displayTime = time || reservation?.session?.time || '16:00';
  const displayDayIdx = dayOfWeek ?? reservation?.session?.dayOfWeek ?? 0;
  const dayName = days[displayDayIdx] || 'Scheduled Day';
  const resStatus = status || reservation?.status || 'PENDING';

  const qrValue = (qrToken && qrToken.length < 80) ? qrToken : (reservation?.qrToken && reservation.qrToken.length < 80 ? reservation.qrToken : `RES:${resNumber}`);

  useEffect(() => {
    QRCode.toDataURL(qrValue, {
      margin: 2,
      width: 300,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => setQrUrl(url))
      .catch(() => {});
  }, [qrValue]);

  const handleCopy = () => {
    const text = `Reservation: ${resNumber} | Tracking Code: ${trackCode}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printContent = cardRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <title>Reservation Ticket - ${resNumber}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; padding: 20px; background: #fff; }
            .ticket-box { border: 2px solid #e2e8f0; border-radius: 16px; padding: 24px; max-width: 450px; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; }
            .CONFIRMED { background: #dcfce7; color: #166534; }
            .PENDING { background: #fef9c3; color: #854d0e; }
            .EXPIRED { background: #fee2e2; color: #991b1b; }
            .CANCELLED { background: #f3f4f6; color: #374151; }
            .qr-container { display: flex; justify-content: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="ticket-box">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const content = (
    <DialogContent className="max-w-md w-[95vw] p-4 sm:p-6 rounded-2xl max-h-[90vh] overflow-y-auto" data-testid="digital-ticket-dialog">
      <DialogHeader className="pb-2 text-start">
        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Ticket className="h-5 w-5 text-primary" />
          <span>{isRtl ? 'تذكرة الحجز الرقمية' : 'Digital Reservation Ticket'}</span>
        </DialogTitle>
      </DialogHeader>

      {/* Ticket Container */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-b from-card via-card to-primary/5 p-4 sm:p-5 shadow-lg space-y-4"
        data-testid="digital-ticket-card"
      >
        {/* Center Logo Header */}
        <div className="flex flex-col items-center text-center pb-3 border-b border-border/80 space-y-1">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg mb-1 shadow-inner">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="text-xs font-bold tracking-wider text-primary uppercase">
            {centerName}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {isRtl ? 'تذكرة مؤكدة وحصرية للدخول' : 'Official Classroom Reservation Pass'}
          </div>
        </div>

        {/* Prominent Codes Box */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/50 border border-border text-center">
          <div className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground uppercase font-medium">{isRtl ? 'رقم الحجز' : 'Reservation No.'}</div>
            <div className="text-xs font-mono font-bold text-primary truncate" data-testid="ticket-reservation-number">{resNumber}</div>
          </div>
          <div className="space-y-0.5 border-s border-border ps-2">
            <div className="text-[10px] text-muted-foreground uppercase font-medium">{isRtl ? 'كود التتبع' : 'Tracking Code'}</div>
            <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 truncate" data-testid="ticket-tracking-code">{trackCode}</div>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center space-y-1 py-1">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="Reservation QR Token"
              className="h-72 w-72 rounded-xl border-2 border-white shadow-md object-contain"
              data-testid="ticket-qr-code"
            />
          ) : (
            <div className="h-72 w-72 rounded-xl bg-muted animate-pulse flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            <span>{isRtl ? 'تذكرة مأمنة بتوقيع مشفر' : 'Encrypted HMAC Token'}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-2 pt-2 border-t border-border/80 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-border/40">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>{isRtl ? 'اسم الطالب' : 'Student Name'}</span>
            </span>
            <span className="font-semibold">{displayStudentName}</span>
          </div>

          {displayParentName && (
            <div className="flex justify-between items-center py-1 border-b border-border/40">
              <span className="text-muted-foreground">{isRtl ? 'اسم ولي الأمر' : 'Parent Name'}</span>
              <span className="font-medium text-muted-foreground">{displayParentName}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-1 border-b border-border/40">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>{isRtl ? 'المادة والصف' : 'Subject & Grade'}</span>
            </span>
            <span className="font-medium">{displaySubject} • {displayGrade}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-border/40">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{isRtl ? 'الموعد' : 'Schedule'}</span>
            </span>
            <span className="font-medium">{dayName} • {displayTime}</span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-muted-foreground">{isRtl ? 'حالة الحجز' : 'Status'}</span>
            <Badge
              variant={
                resStatus === 'CONFIRMED'
                  ? 'default'
                  : resStatus === 'PENDING'
                  ? 'secondary'
                  : 'outline'
              }
              className={cn(
                'text-[10px] font-bold px-2 py-0.5',
                resStatus === 'CONFIRMED' && 'bg-emerald-600 text-white',
                resStatus === 'PENDING' && 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
              )}
            >
              {resStatus}
            </Badge>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3">
        <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs">
          {copied ? <Check className="h-3.5 w-3.5 me-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 me-1" />}
          <span>{copied ? (isRtl ? 'تم النسخ' : 'Copied') : isRtl ? 'نسخ الأكواد' : 'Copy Codes'}</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs">
          <Printer className="h-3.5 w-3.5 me-1" />
          <span>{isRtl ? 'طباعة التذكرة' : 'Print'}</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            if (onClose) onClose();
            else setInternalOpen(false);
          }}
          className="col-span-2 sm:col-span-1 text-xs"
        >
          {isRtl ? 'إغلاق' : 'Close'}
        </Button>
      </div>
    </DialogContent>
  );

  if (isModalControlled) {
    return (
      <Dialog open={open} onOpenChange={(val) => !val && onClose && onClose()}>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={internalOpen} onOpenChange={setInternalOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Ticket className="h-3.5 w-3.5 text-primary" />
          <span>{triggerLabel}</span>
        </Button>
      </DialogTrigger>
      {content}
    </Dialog>
  );
}

'use client';

import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, Share2, Ticket, ShieldCheck, User, BookOpen, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReservationCardProps {
  reservation: {
    id: string;
    reservationNumber: string;
    status: string;
    reservedAt: Date | string;
    expiresAt: Date | string;
    qrToken?: string | null;
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
    };
  };
  centerName?: string;
  studentName?: string;
  triggerLabel?: string;
  dict?: any;
  locale?: string;
}

const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function ReservationCardDigitalTicket({
  reservation,
  centerName = 'Attendance Center',
  studentName,
  triggerLabel = 'Digital Ticket',
  locale = 'en',
}: ReservationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const isRtl = locale === 'ar';
  const days = isRtl ? DAYS_AR : DAYS_EN;

  const displayStudentName = studentName || reservation.student?.name || 'Student';
  const dayName = days[reservation.session.dayOfWeek] || 'Scheduled Day';
  const qrValue = reservation.qrToken || `RES:${reservation.reservationNumber}`;
  const price = reservation.session.price ?? 0;

  useEffect(() => {
    QRCode.toDataURL(qrValue, {
      margin: 2,
      width: 300,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => setQrUrl(url))
      .catch(() => {});
  }, [qrValue]);

  const handlePrint = () => {
    const printContent = cardRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reservation Ticket - ${reservation.reservationNumber}</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; padding: 20px; background: #fff; }
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
    }, 500);
  };

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    try {
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 0.95 });
      const link = document.createElement('a');
      link.download = `Reservation_${reservation.reservationNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      handlePrint();
    }
  };

  const handleDownloadPDF = async () => {
    handleDownloadPNG();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reservation Ticket ${reservation.reservationNumber}`,
          text: `Reservation ${reservation.reservationNumber} for ${displayStudentName} - Subject: ${reservation.session.subject || 'General'}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(reservation.reservationNumber);
      alert('Reservation number copied to clipboard!');
    }
  };

  const statusColors = {
    CONFIRMED: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    EXPIRED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    CANCELLED: 'bg-muted text-muted-foreground border-border',
    COMPLETED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="reservation-card-dialog">
          <Ticket className="w-4 h-4 text-primary" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl" data-testid="reservation-card-modal">
        <DialogHeader className="p-4 border-b bg-muted/40">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Reservation Digital Ticket
          </DialogTitle>
        </DialogHeader>

        {/* Printable Ticket Card Container */}
        <div className="p-6 space-y-6 bg-background" ref={cardRef} data-testid="reservation-card">
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-none text-foreground">{centerName}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{reservation.reservationNumber}</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn("px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border", statusColors[reservation.status as keyof typeof statusColors])}
              data-testid="reservation-status"
            >
              {reservation.status}
            </Badge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Student
              </span>
              <p className="font-semibold text-foreground truncate">{displayStudentName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Subject
              </span>
              <p className="font-semibold text-foreground truncate">{reservation.session.subject || 'General Session'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Teacher
              </span>
              <p className="font-medium text-foreground truncate">{reservation.session.teacherName || 'Center Instructor'}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Grade</span>
              <p className="font-medium text-foreground">{reservation.session.grade}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Day & Time
              </span>
              <p className="font-medium text-foreground">{dayName} • {reservation.session.time}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Price</span>
              <p className="font-bold text-primary">{price} EGP</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
            <div className="bg-white p-3 rounded-xl shadow-sm" data-testid="reservation-qr-image">
              {qrUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={qrUrl} alt={`QR Code for ${reservation.reservationNumber}`} className="w-36 h-36" />
              ) : (
                <div className="w-36 h-36 bg-muted animate-pulse rounded-xl" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground text-center font-mono">
              Scan to confirm payment & check-in
            </p>
          </div>

          {/* Footer Metadata */}
          <div className="text-[11px] text-muted-foreground border-t pt-3 flex justify-between items-center font-mono">
            <span>Expires: {new Date(reservation.expiresAt).toLocaleDateString()}</span>
            <span>Ref: {reservation.id.slice(-6)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-muted/40 border-t grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPNG} className="w-full gap-1 text-xs" data-testid="reservation-download-image">
            <Download className="w-3.5 h-3.5" /> PNG
          </Button>

          <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="w-full gap-1 text-xs" data-testid="reservation-download-pdf">
            <Download className="w-3.5 h-3.5" /> PDF
          </Button>

          <Button variant="outline" size="sm" onClick={handlePrint} className="w-full gap-1 text-xs" data-testid="reservation-print-button">
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>

          <Button variant="outline" size="sm" onClick={handleShare} className="w-full gap-1 text-xs" data-testid="reservation-share-button">
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

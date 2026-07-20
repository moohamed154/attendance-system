'use client';

import { StudentQRCode } from './StudentQRCode';
import { Button } from '@/components/ui/button';
import { Printer, Smartphone, ArrowLeft, CheckCircle2, XCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import * as htmlToImage from 'html-to-image';

interface StudentCardProps {
  student: {
    id: string;
    studentId: string;
    name: string;
    grade: string | null;
    studentPhone: string | null;
    status: string | null;
  };
  dict: any;
  centerName?: string;
  teacherName?: string;
}

export function StudentCard({ student, dict, centerName, teacherName }: StudentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBtn, setShowPwaBtn] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const sp = dict.studentPortal || {};
  const isActive = student.status?.toUpperCase() === 'ACTIVE' || student.status === 'نشط' || !student.status;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setTimeout(() => setShowPwaBtn(false), 0);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPwaBtn(false);
    }
    setDeferredPrompt(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    try {
      setIsDownloading(true);
      // Ensure fonts and images are loaded before capture
      await new Promise(resolve => setTimeout(resolve, 100));
      const dataUrl = await htmlToImage.toPng(cardRef.current, { 
        pixelRatio: 3,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '320px',
          height: '520px'
        }
      });
      const link = document.createElement('a');
      link.download = `student-${student.studentId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const currentDate = new Date().toLocaleString('ar-EG', { 
    dateStyle: 'short', 
    timeStyle: 'short' 
  });

  return (
    <div className="space-y-6 flex flex-col items-center w-full px-4 pt-4">
      {/* Back link */}
      <Link
        href="/student"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors print:hidden"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        {sp.backToLookup || 'Back to Lookup'}
      </Link>

      {/* Printable Card Frame */}
      <div 
        ref={cardRef}
        className="w-[320px] h-[520px] shrink-0 bg-card border border-border/50 rounded-3xl shadow-xl relative overflow-hidden print:border print:border-black/20 print:shadow-none print:bg-white print:text-black flex flex-col"
        style={{ pageBreakInside: 'avoid' }}
      >
        <div className="h-2 bg-gradient-to-r from-primary/80 via-primary to-primary/80 print:hidden shrink-0" />

        <div className="p-6 flex-1 flex flex-col items-center justify-between">
          
          {/* Logo Header */}
          <div className="flex flex-col items-center gap-0.5 w-full shrink-0">
            <h2 className="text-2xl font-black text-foreground tracking-tight text-center print:text-black line-clamp-1">
              {centerName || 'اسم المركز غير محدد'}
            </h2>
            <p className="text-sm font-bold text-muted-foreground print:text-black/70">
              الأستاذ / {teacherName || 'اسم المدرس غير محدد'}
            </p>
          </div>

          <hr className="w-full border-border/50 print:border-black/10 shrink-0" />

          {/* Student Info Details */}
          <div className="w-full text-center shrink-0">
            <h1 className="text-xl font-extrabold text-foreground tracking-tight print:text-black line-clamp-1">
              {student.name}
            </h1>
            <p className="text-xs font-mono text-muted-foreground print:text-black/60">
              ID: {student.studentId}
            </p>
          </div>

          {/* QR Code Container */}
          <StudentQRCode value={student.studentId} />

          <hr className="w-full border-border/50 print:border-black/10" />

          {/* Details Grid */}
          <div className="w-full grid grid-cols-2 gap-2 text-start bg-muted/30 dark:bg-muted/10 print:bg-transparent border border-border/30 rounded-2xl p-3 print:border-black/10 shrink-0">
            <div>
              <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider block print:text-black/50">
                {sp.grade || 'Grade'}
              </span>
              <span className="font-semibold text-sm text-foreground print:text-black">
                {student.grade === '1' ? dict.grades.grade1 : 
                 student.grade === '2' ? dict.grades.grade2 : 
                 student.grade === '3' ? dict.grades.grade3 : student.grade || '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider block print:text-black/50">
                {dict.general.status.status || 'Status'}
              </span>
              <span className={`inline-flex items-center gap-1 font-semibold text-sm ${isActive ? 'text-green-600 dark:text-green-400 print:text-black' : 'text-destructive print:text-black'}`}>
                {isActive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 print:hidden text-green-600 dark:text-green-400" />
                    {sp.statusActive || 'Active'}
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 print:hidden text-destructive" />
                    {sp.statusInactive || 'Inactive'}
                  </>
                )}
              </span>
            </div>
            {student.studentPhone && (
              <div className="col-span-2">
                <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider block print:text-black/50">
                  {sp.phone || 'Phone'}
                </span>
                <span className="font-semibold text-sm text-foreground font-mono print:text-black">
                  {student.studentPhone}
                </span>
              </div>
            )}
          </div>
          
          {/* Print Date */}
          <div className="w-full text-center shrink-0 pt-1">
            <p className="text-[10px] font-medium text-muted-foreground/60 print:text-black/40" dir="rtl">
              تاريخ الطباعة: <span className="font-mono">{currentDate}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons for Print/PWA */}
      <div className="flex flex-col gap-3 w-full max-w-[320px] print:hidden">
        <div className="flex gap-2 w-full">
          <Button
            onClick={handlePrint}
            className="flex-1 h-12 rounded-xl text-base font-semibold shadow-md gap-2"
          >
            <Printer className="w-5 h-5" />
            {sp.printCard || 'Print Card'}
          </Button>
          <Button
            onClick={handleDownloadCard}
            variant="secondary"
            disabled={isDownloading}
            className="flex-1 h-12 rounded-xl text-base font-semibold shadow-md gap-2"
          >
            <Download className="w-5 h-5" />
            تنزيل البطاقة
          </Button>
        </div>

        {showPwaBtn && (
          <div className="bg-muted/40 dark:bg-muted/10 border border-border/40 rounded-2xl p-4 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed text-center">
              {sp.pwaSuggestion || 'For faster access, add the student portal to your home screen.'}
            </p>
            <Button
              onClick={handleInstallClick}
              variant="outline"
              className="w-full h-10 rounded-xl text-sm font-semibold gap-2 border-border/50"
            >
              <Smartphone className="w-4 h-4" />
              {sp.addToHome || 'Add to Home Screen'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

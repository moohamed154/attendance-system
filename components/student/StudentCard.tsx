'use client';

import { StudentQRCode } from './StudentQRCode';
import { Button } from '@/components/ui/button';
import { Printer, Smartphone, ArrowLeft, GraduationCap, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
}

export function StudentCard({ student, dict }: StudentCardProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBtn, setShowPwaBtn] = useState(false);

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

  return (
    <div className="space-y-6 max-w-md mx-auto w-full px-4 pt-4">
      {/* Back link */}
      <Link
        href="/student"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors print:hidden"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        {sp.backToLookup || 'Back to Lookup'}
      </Link>

      {/* Printable Card Frame */}
      <div className="bg-card border border-border/50 rounded-3xl shadow-xl overflow-hidden relative print:border print:border-black/20 print:shadow-none print:bg-white print:text-black">
        <div className="h-2 bg-gradient-to-r from-primary/80 via-primary to-primary/80 print:hidden" />

        <div className="p-6 md:p-8 space-y-6 flex flex-col items-center">
          
          {/* Logo Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center print:border print:border-black/10">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight print:text-black">
                {sp.studentCard || 'Student Card'}
              </h2>
            </div>
          </div>

          <hr className="w-full border-border/50 print:border-black/10" />

          {/* Student Info Details */}
          <div className="w-full text-center space-y-2">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight print:text-black">
              {student.name}
            </h1>
            <p className="text-sm font-mono text-muted-foreground print:text-black/60">
              ID: {student.studentId}
            </p>
          </div>

          {/* QR Code Container */}
          <StudentQRCode value={student.studentId} studentName={student.name} dict={dict} />

          <hr className="w-full border-border/50 print:border-black/10" />

          {/* Details Grid */}
          <div className="w-full grid grid-cols-2 gap-4 text-sm text-start bg-muted/30 dark:bg-muted/10 print:bg-transparent border border-border/30 rounded-2xl p-4 print:border-black/10">
            <div>
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block print:text-black/50">
                {sp.grade || 'Grade'}
              </span>
              <span className="font-semibold text-foreground print:text-black">
                {student.grade === '1' ? dict.grades.grade1 : 
                 student.grade === '2' ? dict.grades.grade2 : 
                 student.grade === '3' ? dict.grades.grade3 : student.grade || '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block print:text-black/50">
                {dict.general.status.status || 'Status'}
              </span>
              <span className={`inline-flex items-center gap-1 font-semibold ${isActive ? 'text-green-600 dark:text-green-400 print:text-black' : 'text-destructive print:text-black'}`}>
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
                <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block print:text-black/50">
                  {sp.phone || 'Phone'}
                </span>
                <span className="font-semibold text-foreground font-mono print:text-black">
                  {student.studentPhone}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons for Print/PWA */}
      <div className="flex flex-col gap-3 print:hidden">
        <Button
          onClick={handlePrint}
          className="w-full h-12 rounded-xl text-base font-semibold shadow-md gap-2"
        >
          <Printer className="w-5 h-5" />
          {sp.printCard || 'Print Card'}
        </Button>

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

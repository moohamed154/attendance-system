import { getSessionAttendance } from '@/actions/attendance';
import { notFound } from 'next/navigation';
import { getDictionary } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { QrCode, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default async function QrComingSoonPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const dict = await getDictionary();
  const session = await getSessionAttendance(sessionId);

  if (!session) {
    notFound();
  }

  const m = dict.attendanceMode || {};

  const benefits = [
    m.benefitFast || 'Fast attendance',
    m.benefitScan || 'Scan using camera',
    m.benefitAuto || 'Automatic verification',
    m.benefitPrevent || 'Prevent duplicate attendance',
    m.benefitMobile || 'Works on mobile devices',
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4">
      <Card className="rounded-3xl border-border/50 shadow-lg overflow-hidden bg-card">
        <CardContent className="p-8 md:p-12 flex flex-col items-center text-center space-y-8">
          
          {/* Coming Soon Badge */}
          <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary hover:bg-primary/10 font-semibold px-4 py-1.5 text-xs tracking-wider uppercase">
            {m.comingSoon || 'Coming Soon'}
          </Badge>

          {/* Large QR Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-xl" />
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-3xl border-2 border-primary/20 bg-background flex items-center justify-center text-primary shadow-sm">
              <QrCode className="w-20 h-20 md:w-24 md:h-24 stroke-[1.25]" />
            </div>
          </div>

          {/* Texts */}
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {m.qrTitle || 'QR Code Attendance'}
            </h1>
            <p className="text-lg text-foreground/80 font-medium">
              {m.comingSoonDesc || 'This feature is currently under development.'}
            </p>
            <p className="text-muted-foreground text-sm max-w-md">
              {m.comingSoonDescription || 'QR Code attendance will be available in a future update.'}
            </p>
          </div>

          {/* Benefits List */}
          <div className="w-full max-w-sm bg-muted/30 dark:bg-muted/10 border rounded-2xl p-6 text-start space-y-3">
            <h3 className="font-bold text-sm text-foreground/80 tracking-wide uppercase">
              {m.benefitsTitle || 'Key Benefits:'}
            </h3>
            <ul className="space-y-2.5">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-4">
            <Link 
              href={`/dashboard/attendance/select/${sessionId}`}
              className={buttonVariants({ variant: 'outline', className: 'rounded-xl h-12 flex-1 gap-2' })}
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              {m.back || 'Back'}
            </Link>
            <Link 
              href="/dashboard"
              className={buttonVariants({ className: 'rounded-xl h-12 flex-1' })}
            >
              {m.returnSessions || 'Return to Sessions'}
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

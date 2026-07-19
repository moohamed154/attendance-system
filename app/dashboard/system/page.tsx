import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getBackupList } from '@/lib/backup-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLocale } from '@/lib/i18n';
import { Database, HardDrive, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SystemPage() {
  const session = await getSession();
  const locale = await getLocale();
  const isRtl = locale === 'ar';

  // Check admin role authorization
  if (session?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  let dbStatus = 'connected';
  const dbProvider = 'Neon PostgreSQL';
  let dbError = null;

  try {
    await prisma.$queryRawUnsafe('SELECT 1');
  } catch (err: any) {
    dbStatus = 'disconnected';
    dbError = err.message || 'Connection failed';
  }

  // Uptime and memory usage
  const uptimeSeconds = Math.floor(process.uptime());
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeFormatted = isRtl
    ? `${uptimeHours} ساعة، ${uptimeMinutes} دقيقة`
    : `${uptimeHours}h ${uptimeMinutes}m`;

  const memory = process.memoryUsage();
  const ramRss = `${Math.round(memory.rss / 1024 / 1024)} MB`;
  const ramHeap = `${Math.round(memory.heapUsed / 1024 / 1024)} MB`;

  // Backups and generations
  const backups = getBackupList();
  const lastBackup = backups[0]?.date 
    ? new Date(backups[0].date).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US') 
    : (isRtl ? 'لا يوجد' : 'None');

  const lastGen = await prisma.monthlyGenerationSnapshot.findFirst({
    orderBy: { startedAt: 'desc' }
  });

  const lastGenTime = lastGen?.startedAt
    ? new Date(lastGen.startedAt).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')
    : (isRtl ? 'لا يوجد' : 'None');

  // Translations
  const t = {
    title: isRtl ? 'حالة النظام والصيانة' : 'System Health & Maintenance',
    subtitle: isRtl ? 'مراقبة أداء الخادم، والاتصال بقاعدة البيانات، والنسخ الاحتياطية.' : 'Monitor server performance, database connectivity, and backups.',
    appStatus: isRtl ? 'حالة التطبيق' : 'Application Status',
    dbStatus: isRtl ? 'حالة قاعدة البيانات' : 'Database Status',
    provider: isRtl ? 'مزود الخدمة' : 'Database Provider',
    uptime: isRtl ? 'مدة تشغيل الخادم' : 'System Uptime',
    ramUsage: isRtl ? 'استخدام الذاكرة (RAM)' : 'Memory Usage (RAM)',
    version: isRtl ? 'الإصدار الحالي' : 'App Version',
    env: isRtl ? 'بيئة التشغيل' : 'Environment',
    lastBackup: isRtl ? 'آخر نسخة احتياطية' : 'Last Backup',
    lastGen: isRtl ? 'آخر توليد مستحقات' : 'Last Monthly Generation',
    healthOk: isRtl ? 'يعمل بشكل جيد' : 'Healthy',
    healthError: isRtl ? 'فشل الاتصال' : 'Connection Failed',
    backupBtn: isRtl ? 'أخذ نسخة احتياطية الآن' : 'Trigger Manual Backup',
    logsTitle: isRtl ? 'سجل النسخ الاحتياطية' : 'Backup Register',
    noBackups: isRtl ? 'لا توجد نسخ احتياطية مسجلة' : 'No backups registered yet.',
    filename: isRtl ? 'اسم الملف' : 'Filename',
    date: isRtl ? 'التاريخ' : 'Date',
    size: isRtl ? 'الحجم' : 'Size',
    checksum: isRtl ? 'رمز التحقق (SHA-256)' : 'Checksum (SHA-256)',
  };

  return (
    <div className="space-y-6 p-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* App Status Card */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t.appStatus}</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.version}</span>
              <Badge variant="outline">v0.1.0</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.env}</span>
              <Badge variant="secondary" className="uppercase">{process.env.NODE_ENV}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.uptime}</span>
              <span className="font-semibold text-sm">{uptimeFormatted}</span>
            </div>
          </CardContent>
        </Card>

        {/* Database Status Card */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t.dbStatus}</CardTitle>
            <Database className={`h-4 w-4 ${dbStatus === 'connected' ? 'text-emerald-500' : 'text-destructive'}`} />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.dbStatus}</span>
              <Badge className={dbStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                {dbStatus === 'connected' ? t.healthOk : t.healthError}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.provider}</span>
              <span className="text-sm font-semibold">{dbProvider}</span>
            </div>
            {dbError && (
              <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg mt-2 font-mono overflow-auto max-h-[60px]">
                {dbError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance / Storage Card */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{t.ramUsage}</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">RSS Memory</span>
              <span className="text-sm font-semibold">{ramRss}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Heap Used</span>
              <span className="text-sm font-semibold">{ramHeap}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Operations Logs Card */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>{isRtl ? 'سجلات صيانة النظام' : 'Maintenance Metrics'}</CardTitle>
            <CardDescription>{isRtl ? 'تواريخ آخر عمليات خلفية مجدولة للسلامة' : 'Timestamps of the latest system maintenance routines'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-accent/20">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{t.lastBackup}</p>
                <p className="text-xs text-muted-foreground">{isRtl ? 'نسخة قاعدة البيانات المضغوطة' : 'Database backup snapshots'}</p>
              </div>
              <span className="text-sm font-semibold">{lastBackup}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-accent/20">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{t.lastGen}</p>
                <p className="text-xs text-muted-foreground">{isRtl ? 'إنشاء الاشتراكات الشهرية المستحقة' : 'Subscription billing execution'}</p>
              </div>
              <span className="text-sm font-semibold">{lastGenTime}</span>
            </div>
          </CardContent>
        </Card>

        {/* Backups Action Card */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>{t.logsTitle}</CardTitle>
            <CardDescription>{isRtl ? 'النسخ الاحتياطية للبيانات المتاحة محلياً' : 'Database backup archives currently kept on system'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[300px] overflow-y-auto">
            {backups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t.noBackups}</p>
            ) : (
              backups.map((b) => (
                <div key={b.filename} className="p-3 rounded-xl border border-border/40 bg-accent/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold font-mono">{b.filename}</span>
                    <Badge variant={b.isValid ? 'outline' : 'destructive'} className="text-xs">
                      {b.isValid ? (isRtl ? 'سليم' : 'Valid') : (isRtl ? 'تالف' : 'Corrupted')}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{new Date(b.date).toLocaleDateString()}</span>
                    <span>{Math.round(b.size / 1024)} KB</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                    Hash: {b.checksum}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, CalendarPlus, Loader2, Download, AlertTriangle } from 'lucide-react';
import { useDictionary } from '@/components/dictionary-provider';
import { getNewMonthPreview, generateNewMonthChunk, finalizeNewMonthGeneration, lockGeneration, unlockGeneration } from '@/actions/subscriptions';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function NewMonthWizard() {
  const dict = useDictionary();
  const router = useRouter();
  const t = dict.newMonthWizard || {};

  const [step, setStep] = useState(1);
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');
  
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation state
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [generationStats, setGenerationStats] = useState<any>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear + i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  const handlePreview = async () => {
    if (!month || !year) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getNewMonthPreview(parseInt(month), parseInt(year));
      if (res.error) {
        setError(res.error);
      } else {
        setPreviewData(res);
        setStep(2);
      }
    } catch {
      setError(t.errorPreview || 'An unexpected error occurred while generating the preview.');
    }
    setIsLoading(false);
  };

  const exportPreviewExcel = () => {
    if (!previewData?.previewExportData) return;
    const headers = ['ID', 'Name', 'Student ID', 'Grade', 'Session', 'Teacher', 'Fee', 'Status', 'Will Generate', 'Skip Reason'];
    const rows = previewData.previewExportData.map((d: any) => [
      d.id, d.name, d.studentId, d.grade, d.session, d.teacher, d.fee, d.status, d.willGenerate, d.skipReason
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\\n" 
        + rows.map((e: any[]) => e.map(item => `"${item}"`).join(",")).join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `preview_month_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async () => {
    if (!previewData || !previewData.studentsToGenerate) return;
    
    setIsLoading(true);
    setError(null);

    const lockRes = await lockGeneration(parseInt(month), parseInt(year));
    if (lockRes.error) {
      setError(lockRes.error);
      setIsLoading(false);
      return;
    }

    const studentIds = previewData.studentsToGenerate;

    setStep(4);
    setIsLoading(false);
    
    const startTime = Date.now();
    let processed = 0;
    let totalRevenueAdded = 0;
    const chunkSize = 50; 
    let failedIds: string[] = [];

    try {
      for (let i = 0; i < studentIds.length; i += chunkSize) {
        const chunkStartTime = Date.now();
        const chunk = studentIds.slice(i, i + chunkSize);
        
        const res = await generateNewMonthChunk(parseInt(month), parseInt(year), chunk);
        
        if (res.error) {
          setError(res.error);
          break;
        }

        processed += res.count || 0;
        totalRevenueAdded += res.revenue || 0;
        if (res.failed) failedIds = [...failedIds, ...res.failed];
        
        setProcessedCount(processed + failedIds.length);
        setProgress(Math.round(((i + chunk.length) / studentIds.length) * 100));

        const chunkTime = Date.now() - chunkStartTime;
        const chunksRemaining = Math.ceil((studentIds.length - (i + chunk.length)) / chunkSize);
        setEstimatedTimeRemaining(chunkTime * chunksRemaining);
      }

      const endTime = Date.now();
      const timeSpent = endTime - startTime;
      
      const finalStats = {
        totalStudents: previewData.stats.totalStudents,
        count: processed,
        revenue: totalRevenueAdded,
        skipped: previewData.stats.skippedStudents,
        archived: previewData.stats.archivedStudents,
        inactive: previewData.stats.inactiveStudents,
        frozen: previewData.stats.frozenStudents,
        time: timeSpent
      };
      
      await finalizeNewMonthGeneration(parseInt(month), parseInt(year), finalStats, failedIds, previewData.skippedDetails);

      setGenerationStats(finalStats);
      setStep(5);
      
    } catch {
      await unlockGeneration(parseInt(month), parseInt(year));
      setError(t.errorGeneration || 'A critical error occurred during generation. Process unlocked.');
      setStep(3);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 px-4 relative">
        <div className="absolute rtl:right-0 ltl:left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out" 
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          />
        </div>
        {[1, 2, 3, 4, 5].map((s) => (
          <div 
            key={s} 
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-300 ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
          </div>
        ))}
      </div>

      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle>
            {step === 1 && (t.step1 || 'Select Month & Year')}
            {step === 2 && (t.step2 || 'Generation Preview')}
            {step === 3 && (t.step3 || 'Confirm Generation')}
            {step === 4 && (t.step4 || 'Generating Subscriptions...')}
            {step === 5 && (t.step5 || 'Generation Complete!')}
          </CardTitle>
          <CardDescription>
            {step === 1 && (t.step1Desc || '')}
            {step === 2 && (t.step2Desc || '')}
            {step === 3 && (t.step3Desc || '')}
            {step === 4 && (t.step4Desc || '')}
            {step === 5 && (t.step5Desc || '')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">{t.selectMonth || 'Month'}</label>
                <Select value={month} onValueChange={(v) => setMonth(v || '')}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder={t.selectMonth} /></SelectTrigger>
                  <SelectContent>
                    {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">{t.selectYear || 'Year'}</label>
                <Select value={year} onValueChange={(v) => setYear(v || '')}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder={t.selectYear} /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && previewData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-4 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">{t.activeStudents || 'Active Students'}</p>
                  <p className="text-2xl font-bold text-primary">{previewData.stats.activeStudents}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">{t.toGenerate || 'To Generate'}</p>
                  <p className="text-2xl font-bold text-green-600">{previewData.stats.toBeGenerated}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">{t.skipped || 'Skipped'}</p>
                  <p className="text-2xl font-bold text-yellow-600">{previewData.stats.skippedStudents}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">{t.expectedRevenue || 'Expected Revenue'}</p>
                  <p className="text-2xl font-bold">{previewData.stats.expectedRevenue}</p>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertTitle>{t.smartSkipWarnings}</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc rtl:pr-4 ltr:pl-4 mt-2 space-y-1 text-sm">
                    {previewData.stats.alreadyExisting > 0 && <li>{(t.alreadyHaveSubscription || '').replace('{count}', previewData.stats.alreadyExisting)}</li>}
                    {previewData.stats.archivedStudents > 0 && <li>{(t.archivedStudents || '').replace('{count}', previewData.stats.archivedStudents)}</li>}
                    {previewData.stats.inactiveStudents > 0 && <li>{(t.inactiveStudents || '').replace('{count}', previewData.stats.inactiveStudents)}</li>}
                    {previewData.stats.frozenStudents > 0 && <li>{(t.frozenStudents || '').replace('{count}', previewData.stats.frozenStudents)}</li>}
                    {previewData.stats.studentsMissingFee > 0 && <li>{(t.missingFee || '').replace('{count}', previewData.stats.studentsMissingFee)}</li>}
                    {previewData.stats.studentsWithoutSession > 0 && <li>{(t.missingSession || '').replace('{count}', previewData.stats.studentsWithoutSession)}</li>}
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={exportPreviewExcel}><Download className="w-4 h-4 rtl:ml-2 ltr:mr-2" /> {t.exportCsv || 'Export CSV'}</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-8 text-center space-y-4">
              <CalendarPlus className="w-16 h-16 text-primary mx-auto opacity-50" />
              <h3 className="text-xl font-medium">{t.readyToGenerate}</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {(t.readyDesc || '').replace('{count}', previewData?.stats.toBeGenerated).replace('{month}', month).replace('{year}', year)}
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="py-8 space-y-8">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-medium mb-1">{t.processingStudents}</p>
                  <p className="text-2xl font-bold">{processedCount} / {previewData?.stats.toBeGenerated}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t.estimatedRemaining}</p>
                  <p className="font-medium">{estimatedTimeRemaining !== null ? `${estimatedTimeRemaining}s` : t.calculating}</p>
                </div>
              </div>
              <Progress value={progress} className="h-4" />
              <p className="text-center text-sm text-muted-foreground animate-pulse">{t.doNotClose}</p>
            </div>
          )}

          {step === 5 && generationStats && (
            <div className="py-8 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold">{t.step5}</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-start">
                 <div className="bg-muted p-3 rounded-lg">
                   <p className="text-xs text-muted-foreground">{t.generated}</p>
                   <p className="text-lg font-semibold">{generationStats.count}</p>
                 </div>
                 <div className="bg-muted p-3 rounded-lg">
                   <p className="text-xs text-muted-foreground">{t.revenueAdded}</p>
                   <p className="text-lg font-semibold">{generationStats.revenue}</p>
                 </div>
                 <div className="bg-muted p-3 rounded-lg">
                   <p className="text-xs text-muted-foreground">{t.skippedFailed}</p>
                   <p className="text-lg font-semibold">{generationStats.skipped}</p>
                 </div>
                 <div className="bg-muted p-3 rounded-lg">
                   <p className="text-xs text-muted-foreground">{t.executionTime}</p>
                   <p className="text-lg font-semibold">{(generationStats.time / 1000).toFixed(1)}s</p>
                 </div>
              </div>

              <div className="pt-6">
                <Button onClick={() => router.push('/dashboard/payments/generations')} className="w-full sm:w-auto rounded-xl">
                  {t.viewHistory}
                </Button>
              </div>
            </div>
          )}

        </CardContent>

        {step < 4 && (
          <CardFooter className="flex justify-between border-t border-border/50 bg-muted/10 p-6">
            <Button 
              variant="outline" 
              onClick={() => setStep(step - 1)}
              disabled={step === 1 || isLoading}
              className="rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 rtl:ml-2 ltr:mr-2 rtl:rotate-180" /> {t.back}
            </Button>

            {step === 1 && (
              <Button onClick={handlePreview} disabled={!month || !year || isLoading} className="rounded-xl">
                {isLoading ? <Loader2 className="w-4 h-4 rtl:ml-2 ltr:mr-2 animate-spin" /> : <ChevronRight className="w-4 h-4 rtl:mr-2 ltr:ml-2 rtl:rotate-180" />}
                {t.runPreview}
              </Button>
            )}

            {step === 2 && (
              <Button onClick={() => setStep(3)} className="rounded-xl">
                {t.next} <ChevronRight className="w-4 h-4 rtl:mr-2 ltr:ml-2 rtl:rotate-180" />
              </Button>
            )}

            {step === 3 && (
              <Button onClick={handleGenerate} disabled={isLoading} className="rounded-xl">
                {isLoading ? <Loader2 className="w-4 h-4 rtl:ml-2 ltr:mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 rtl:ml-2 ltr:mr-2" />}
                {t.startGeneration}
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

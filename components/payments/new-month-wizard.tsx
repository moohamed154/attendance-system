'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, CalendarPlus, Loader2 } from 'lucide-react';
import { useDictionary } from '@/components/dictionary-provider';
import { getNewMonthPreview, generateNewMonthChunk, finalizeNewMonthGeneration } from '@/actions/subscriptions';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function NewMonthWizard() {
  const dict = useDictionary();
  const router = useRouter();
  const t = dict.newMonthWizard;

  const [step, setStep] = useState(1);
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');
  
  const [previewData, setPreviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [generationStats, setGenerationStats] = useState<any>(null);
  const [executionTime, setExecutionTime] = useState(0);

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
    } catch (e) {
      setError(t.errorUnexpected);
    }
    setIsLoading(false);
  };

  const handleGenerate = async () => {
    if (!previewData || !previewData.studentsToGenerate) return;
    const studentIds = previewData.studentsToGenerate;
    
    setIsGenerating(true);
    setStep(4); // Generating step
    
    const startTime = Date.now();
    let processed = 0;
    let totalRevenueAdded = 0;
    const chunkSize = 50;

    try {
      for (let i = 0; i < studentIds.length; i += chunkSize) {
        const chunk = studentIds.slice(i, i + chunkSize);
        const res = await generateNewMonthChunk(parseInt(month), parseInt(year), chunk);
        
        if (res.error) {
          setError(res.error);
          setIsGenerating(false);
          setStep(3); // Go back to confirmation on error
          return;
        }

        processed += res.count || 0;
        totalRevenueAdded += res.revenue || 0;
        
        setProcessedCount(processed);
        setProgress(Math.round(((i + chunkSize) / studentIds.length) * 100));
      }

      const endTime = Date.now();
      const timeSpent = endTime - startTime;
      
      const finalStats = {
        count: processed,
        revenue: totalRevenueAdded,
        skipped: previewData.stats.skippedStudents + (studentIds.length - processed),
        time: timeSpent
      };
      
      await finalizeNewMonthGeneration(parseInt(month), parseInt(year), finalStats);

      setExecutionTime(timeSpent);
      setGenerationStats(finalStats);
      setProgress(100);
      setStep(5); // Success step
    } catch (e) {
      setError(t.errorUnexpected);
      setIsGenerating(false);
      setStep(3);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat((dict as any).locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('EGP', dict.paymentsPage.currency).trim();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Steps Indicator */}
      <div className="flex items-center justify-between mb-8 relative">
        {[
          { num: 1, label: t.step1 },
          { num: 2, label: t.step2 },
          { num: 3, label: t.step3 },
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s.num && step < 4 ? 'bg-primary text-primary-foreground' : step >= 4 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                {step > s.num || step >= 4 ? <CheckCircle2 className="w-6 h-6" /> : s.num}
              </div>
              <span className={`text-sm font-medium ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
            </div>
            {idx < 2 && (
              <div className={`flex-1 h-1 mx-4 rounded-full transition-colors ${step > s.num || step >= 4 ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        {step === 1 && (
          <>
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-primary" />
                {t.step1}
              </CardTitle>
              <CardDescription>{t.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.selectMonth}</label>
                  <Select value={month} onValueChange={(val) => setMonth(val ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectMonth} />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => (
                        <SelectItem key={m} value={m}>{(dict.paymentsPage.months as any)[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t.selectYear}</label>
                  <Select value={year} onValueChange={(val) => setYear(val ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectYear} />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t flex justify-end p-4">
              <Button onClick={handlePreview} disabled={!month || !year || isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.continue}
                <ChevronRight className="w-4 h-4 ml-2 rtl:rotate-180" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && previewData && (
          <>
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle>{t.step2}</CardTitle>
              <CardDescription>{t.readOnlyPreview}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="text-sm text-muted-foreground">{t.monthYear}</div>
                <div className="text-xl font-bold text-primary">{(dict.paymentsPage.months as any)[month]} {year}</div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 border rounded-xl bg-card">
                  <div className="text-2xl font-bold">{previewData.stats.toBeGenerated}</div>
                  <div className="text-sm text-muted-foreground mt-1">{t.toBeGenerated}</div>
                </div>
                <div className="p-4 border rounded-xl bg-card">
                  <div className="text-2xl font-bold">{previewData.stats.alreadyExisting}</div>
                  <div className="text-sm text-muted-foreground mt-1">{t.alreadyExisting}</div>
                </div>
                <div className="p-4 border rounded-xl bg-card">
                  <div className="text-2xl font-bold text-primary">{formatCurrency(previewData.stats.expectedRevenue)}</div>
                  <div className="text-sm text-muted-foreground mt-1">{t.expectedRevenue}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t.activeStudents}</span>
                  <span className="font-medium">{previewData.stats.activeStudents}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t.archivedStudents}</span>
                  <span className="font-medium">{previewData.stats.archivedStudents}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t.averageFee}</span>
                  <span className="font-medium">{formatCurrency(previewData.stats.averageFee)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t.highestFee}</span>
                  <span className="font-medium">{formatCurrency(previewData.stats.highestFee)}</span>
                </div>
              </div>

              {/* Potential Problems */}
              {(previewData.stats.studentsMissingFee > 0 || previewData.stats.studentsWithoutSession > 0) && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl space-y-3">
                  <h4 className="font-semibold text-orange-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {t.potentialProblems}
                  </h4>
                  <ul className="list-disc list-inside text-sm text-orange-600/80 space-y-1">
                    {previewData.stats.studentsMissingFee > 0 && (
                      <li>{previewData.stats.studentsMissingFee} {t.missingMonthlyFee}</li>
                    )}
                    {previewData.stats.studentsWithoutSession > 0 && (
                      <li>{previewData.stats.studentsWithoutSession} {t.studentsWithoutSession}</li>
                    )}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/10 border-t flex justify-between p-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-2 rtl:rotate-180" />
                {t.back}
              </Button>
              <Button onClick={() => setStep(3)} disabled={previewData.stats.toBeGenerated === 0}>
                {t.continue}
                <ChevronRight className="w-4 h-4 ml-2 rtl:rotate-180" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && previewData && (
          <>
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle>{t.step3}</CardTitle>
              <CardDescription>{t.youAreAboutTo} <strong className="text-foreground">{(dict.paymentsPage.months as any)[month]} {year}</strong></CardDescription>
            </CardHeader>
            <CardContent className="pt-6 text-center space-y-6">
              
              <Alert className="bg-primary/5 border-primary/30 text-start">
                <AlertCircle className="w-4 h-4 text-primary" />
                <AlertTitle className="text-primary font-semibold">{t.duplicateWarning}</AlertTitle>
                <AlertDescription className="text-primary/80">
                  {t.alreadyExisting}: <strong>{previewData.stats.alreadyExisting}</strong>. <br/>{t.toBeGenerated}: <strong>{previewData.stats.toBeGenerated}</strong>.
                </AlertDescription>
              </Alert>

              <div className="text-4xl font-black text-primary py-8 flex flex-col items-center">
                {previewData.stats.toBeGenerated} 
                <span className="text-xl text-muted-foreground font-normal mt-2">{dict.dashboard.studentsCount}</span>
              </div>

            </CardContent>
            <CardFooter className="bg-muted/10 border-t flex justify-between p-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-2 rtl:rotate-180" />
                {t.back}
              </Button>
              <Button size="lg" onClick={handleGenerate} className="px-8">
                {t.generate}
              </Button>
            </CardFooter>
          </>
        )}

        {step === 4 && (
          <div className="p-12 text-center space-y-6">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
            <h3 className="text-2xl font-bold">{t.progress}</h3>
            <Progress value={progress} className="h-3" />
            <p className="text-muted-foreground">
              {processedCount} / {previewData?.stats?.toBeGenerated}
            </p>
          </div>
        )}

        {step === 5 && generationStats && (
          <div className="p-12 text-center space-y-8">
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-green-600 mb-2">{t.successTitle}</h2>
              <p className="text-muted-foreground">{(dict.paymentsPage.months as any)[month]} {year}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-start">
              <div className="p-4 border rounded-xl bg-card">
                <div className="text-sm text-muted-foreground mb-1">Generated</div>
                <div className="text-xl font-bold">{generationStats.count}</div>
              </div>
              <div className="p-4 border rounded-xl bg-card">
                <div className="text-sm text-muted-foreground mb-1">Expected Revenue</div>
                <div className="text-xl font-bold text-primary">{formatCurrency(generationStats.revenue)}</div>
              </div>
              <div className="p-4 border rounded-xl bg-card">
                <div className="text-sm text-muted-foreground mb-1">{t.skippedStudents}</div>
                <div className="text-xl font-bold">{generationStats.skipped}</div>
              </div>
              <div className="p-4 border rounded-xl bg-card">
                <div className="text-sm text-muted-foreground mb-1">{t.executionTime}</div>
                <div className="text-xl font-bold">{(executionTime / 1000).toFixed(2)}s</div>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                {t.returnToDashboard}
              </Button>
              <Button onClick={() => router.push(`/dashboard/payments?month=${month}&year=${year}`)}>
                {t.viewGeneratedMonth}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

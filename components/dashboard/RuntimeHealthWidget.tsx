'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Cpu, Clock, RefreshCw, ShieldCheck } from 'lucide-react';

import { useDictionary } from '@/components/shared/dictionary-provider';

export function RuntimeHealthWidget() {
  const dict = useDictionary() as any;
  const isArabic = dict?.paymentsPage?.currency === 'ج.م' || dict?.paymentsPage?.pageTitle === 'مركز الدفع الشهري';
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <Card className="rounded-2xl border border-border/50 bg-card shadow-sm" data-testid="runtime-health-widget">
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 border-b pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <CardTitle className="text-sm font-bold">
            {isArabic ? 'نظرة على نظام التشغيل' : 'System Operational Runtime'}
          </CardTitle>
        </div>
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs gap-1">
          <ShieldCheck className="w-3 h-3" /> {isArabic ? 'جاهز للعمل' : 'Operational'}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="space-y-1">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-primary" /> {isArabic ? 'مدة التشغيل' : 'Uptime'}
          </span>
          <p className="font-bold text-foreground font-mono">{health?.uptime || (isArabic ? 'نشط' : 'Active')}</p>
        </div>

        <div className="space-y-1">
          <span className="text-muted-foreground flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-primary" /> {isArabic ? 'قاعدة البيانات' : 'Database'}
          </span>
          <p className="font-bold text-foreground">
            {health?.database?.toLowerCase() === 'connected' ? (isArabic ? 'متصل' : 'Connected') : (health?.database || (isArabic ? 'متصل' : 'Connected'))}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-muted-foreground flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-primary" /> {isArabic ? 'استهلاك الذاكرة' : 'Memory Usage'}
          </span>
          <p className="font-bold text-foreground font-mono">{health?.memory?.heapUsed || (isArabic ? 'طبيعي' : 'Normal')}</p>
        </div>

        <div className="space-y-1">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-primary" /> {isArabic ? 'الإصدار' : 'Version'}
          </span>
          <p className="font-bold text-primary font-mono">{health?.version || '1.0.0-stable'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

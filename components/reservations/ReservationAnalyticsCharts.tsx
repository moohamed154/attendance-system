'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, DollarSign, BookOpen, Layers, CheckCircle2, Clock } from 'lucide-react';
import { getReservationAnalytics } from '@/actions/reservations/reservations';

export function ReservationAnalyticsCharts() {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getReservationAnalytics();
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground" data-testid="reservation-analytics-loading">
        جاري تحميل تحليلات ورسوم الحجوزات البيانية...
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="reservation-analytics-charts">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">إجمالي الحجوزات</p>
              <h3 className="text-2xl font-bold mt-1" data-testid="analytics-total-reservations">
                {analytics.totalReservations}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">مؤكد مدفوع</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1" data-testid="analytics-confirmed-count">
                {analytics.confirmedCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">معلق في الانتظار</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1" data-testid="analytics-pending-count">
                {analytics.pendingCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">الإيراد المتوقع</p>
              <h3 className="text-2xl font-bold text-primary mt-1" data-testid="analytics-expected-revenue">
                {analytics.expectedRevenue} ج.م
              </h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Visual Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subject Breakdown */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>توزيع الحجوزات حسب المادة</span>
            </CardTitle>
            <CardDescription className="text-xs">عدد الطلاب المسجلين لكل مادة ودورة تعليمية</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {analytics.reservationsPerSubject.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات متاحة</div>
            ) : (
              analytics.reservationsPerSubject.map((item: any) => {
                const pct = analytics.totalReservations > 0 ? Math.round((item.count / analytics.totalReservations) * 100) : 0;
                return (
                  <div key={item.subject} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{item.subject}</span>
                      <span>
                        {item.count} حجز ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Grade Breakdown */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>توزيع الحجوزات حسب الصف الدراسي</span>
            </CardTitle>
            <CardDescription className="text-xs">إحصائيات الإقبال لكل مرحلة ثانوية</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {analytics.reservationsPerGrade.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات متاحة</div>
            ) : (
              analytics.reservationsPerGrade.map((item: any) => {
                const pct = analytics.totalReservations > 0 ? Math.round((item.count / analytics.totalReservations) * 100) : 0;
                return (
                  <div key={item.grade} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{item.grade}</span>
                      <span>
                        {item.count} حجز ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, MapPin, Users } from 'lucide-react';

interface CalendarEvent {
  id: string;
  subject: string;
  teacherName: string;
  grade: string;
  dayOfWeek: number;
  time: string;
  room: string;
  capacity?: number | null;
  reservedSeats?: number | null;
}

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function ReservationCalendarView({ events = [] }: { events?: CalendarEvent[] }) {
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly' | 'agenda'>('weekly');

  return (
    <Card className="border-border shadow-sm" data-testid="reservation-calendar-view">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <span>جدول الحصص والجلسات (Calendar Schedule)</span>
        </CardTitle>

        <div className="flex gap-1 bg-muted p-1 rounded-lg text-xs">
          <Button
            size="sm"
            variant={viewMode === 'weekly' ? 'default' : 'ghost'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewMode('weekly')}
            data-testid="calendar-view-weekly"
          >
            أسبوعي (Weekly)
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'monthly' ? 'default' : 'ghost'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewMode('monthly')}
            data-testid="calendar-view-monthly"
          >
            شهري (Monthly)
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'agenda' ? 'default' : 'ghost'}
            className="h-7 text-xs px-2.5"
            onClick={() => setViewMode('agenda')}
            data-testid="calendar-view-agenda"
          >
            أجندة (Agenda)
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {viewMode === 'weekly' && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-xs">
            {DAYS_AR.map((dayName, dayIdx) => {
              const dayEvents = events.filter((e) => e.dayOfWeek === dayIdx);
              return (
                <div key={dayName} className="border rounded-lg p-2.5 space-y-2 bg-muted/20">
                  <div className="font-semibold text-center pb-1 border-b text-primary">{dayName}</div>
                  {dayEvents.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground text-center py-4">لا توجد حصص</div>
                  ) : (
                    dayEvents.map((evt) => (
                      <div key={evt.id} className="p-2 rounded bg-background border shadow-xs space-y-1">
                        <div className="font-semibold">{evt.subject}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {evt.time}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {evt.room}
                        </div>
                        <Badge variant="outline" className="text-[10px] w-full justify-center">
                          {evt.reservedSeats}/{evt.capacity}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'monthly' && (
          <div className="grid grid-cols-7 gap-2 text-xs text-center border p-4 rounded-lg">
            {DAYS_AR.map((dayName) => (
              <div key={dayName} className="font-bold py-1 border-b">
                {dayName}
              </div>
            ))}
            {Array.from({ length: 31 }).map((_, i) => (
              <div key={i} className="min-h-[50px] p-1 border rounded bg-muted/10 text-start text-[10px]">
                <div className="font-semibold text-muted-foreground">{i + 1}</div>
                {i % 3 === 0 && <Badge variant="secondary" className="text-[9px] mt-1">حصة ثانوية</Badge>}
              </div>
            ))}
          </div>
        )}

        {viewMode === 'agenda' && (
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-6">لا توجد حصص قادمة مسجلة في الأجندة.</div>
            ) : (
              events.map((evt) => (
                <div key={evt.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/10 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {DAYS_AR[evt.dayOfWeek]?.[0] || 'ح'}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{evt.subject} — {evt.teacherName}</div>
                      <div className="text-muted-foreground">
                        {DAYS_AR[evt.dayOfWeek]} • {evt.time} • القاعة: {evt.room}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{evt.reservedSeats}/{evt.capacity} مقعد</Badge>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

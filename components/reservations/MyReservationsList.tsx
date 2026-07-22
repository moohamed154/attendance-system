'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cancelReservation } from '@/actions/reservations/reservations';
import { ReservationCardDigitalTicket } from './ReservationCardDigitalTicket';
import { ReservationTimeline } from './ReservationTimeline';
import { Clock, Ticket, XCircle, Calendar, User, BookOpen, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StudentReservationItem {
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
  history?: any[];
}

const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// Expiration Countdown Component
function LiveExpirationCountdown({ expiresAt }: { expiresAt: Date | string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft.isExpired) {
    return <span className="text-xs font-semibold text-red-500">Expired</span>;
  }

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1" data-testid="reservation-countdown">
      <Clock className="w-3.5 h-3.5 animate-pulse" />
      {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
      {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
    </span>
  );
}

export function MyReservationsList({
  reservations = [],
  studentName,
  locale = 'en',
}: {
  reservations: StudentReservationItem[];
  studentName?: string;
  locale?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const days = locale === 'ar' ? DAYS_AR : DAYS_EN;

  const handleCancel = (id: string) => {
    if (!confirm('Are you sure you want to cancel this pending reservation?')) return;
    setCancellingId(id);

    startTransition(async () => {
      await cancelReservation(id, 'Cancelled by student');
      setCancellingId(null);
    });
  };

  const filteredReservations = reservations.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const statusBadgeColors = {
    PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    CONFIRMED: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
    CANCELLED: 'bg-muted text-muted-foreground border-border',
    EXPIRED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    COMPLETED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  };

  return (
    <div className="space-y-4" data-testid="my-reservations-section">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" /> My Current Reservations
        </h3>

        {/* Status Filters */}
        <div className="flex gap-1 overflow-x-auto pb-1" data-testid="reservation-filter">
          {['all', 'PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED'].map((st) => (
            <Button
              key={st}
              variant={filterStatus === st ? 'default' : 'ghost'}
              size="sm"
              className="text-xs h-7 rounded-full capitalize"
              onClick={() => setFilterStatus(st)}
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-muted/20 border border-dashed border-border text-muted-foreground text-xs">
          No reservations found for status &quot;{filterStatus}&quot;.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map((res) => {
            const isCancellingThis = isPending && cancellingId === res.id;
            const isPendingStatus = res.status === 'PENDING';
            const isTimelineOpen = expandedTimelineId === res.id;

            return (
              <Card
                key={res.id}
                className="rounded-2xl border border-border/50 shadow-sm overflow-hidden"
                data-testid="reservation-card"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono font-bold text-foreground" data-testid="reservation-number">
                        {res.reservationNumber}
                      </span>
                      <h4 className="font-bold text-sm">{res.session.subject || 'General Session'}</h4>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full border", statusBadgeColors[res.status as keyof typeof statusBadgeColors])}
                        data-testid="reservation-status"
                      >
                        {res.status}
                      </Badge>
                      {isPendingStatus && <LiveExpirationCountdown expiresAt={res.expiresAt} />}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>{res.session.teacherName || 'Instructor'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Grade: {res.session.grade}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{days[res.session.dayOfWeek]} • {res.session.time}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold text-primary">
                      <span>{res.session.price ?? 0} EGP</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3 gap-2">
                    <div className="flex items-center gap-2">
                      <ReservationCardDigitalTicket
                        reservation={res}
                        studentName={studentName}
                        locale={locale}
                        triggerLabel="Ticket / QR"
                      />

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1 text-muted-foreground"
                        onClick={() => setExpandedTimelineId(isTimelineOpen ? null : res.id)}
                      >
                        Timeline {isTimelineOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>

                    {isPendingStatus && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:bg-destructive/10 gap-1 rounded-xl"
                        onClick={() => handleCancel(res.id)}
                        disabled={isPending}
                        data-testid="cancel-reservation-button"
                      >
                        {isCancellingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        Cancel Reservation
                      </Button>
                    )}
                  </div>

                  {/* Expandable Timeline Section */}
                  {isTimelineOpen && (
                    <div className="pt-2">
                      <ReservationTimeline
                        history={res.history || []}
                        reservedAt={res.reservedAt}
                        expiresAt={res.expiresAt}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

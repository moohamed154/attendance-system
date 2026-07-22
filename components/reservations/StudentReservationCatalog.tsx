'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { createReservation, joinWaitingList, acquireSeatLock, releaseSeatLock } from '@/actions/reservations/reservations';
import { CheckCircle2, Clock, User, BookOpen, MapPin, DollarSign, AlertCircle, BookmarkPlus, Loader2, UserX, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SessionCatalogItem {
  id: string;
  dayOfWeek: number;
  time: string;
  grade: string;
  subject?: string | null;
  teacherName?: string | null;
  capacity?: number | null;
  reservedSeats?: number | null;
  confirmedSeats?: number | null;
  price?: number | null;
  duration?: string | null;
  room?: string | null;
}

const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function StudentReservationCatalog({
  sessions = [],
  activePendingCount = 0,
  maxPendingLimit = 2,
  dict,
  locale = 'en',
}: {
  sessions: SessionCatalogItem[];
  activePendingCount?: number;
  maxPendingLimit?: number;
  dict?: any;
  locale?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successResNumber, setSuccessResNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [duplicateCase1Info, setDuplicateCase1Info] = useState<any | null>(null);
  const [lockedSessionId, setLockedSessionId] = useState<string | null>(null);

  const isRtl = locale === 'ar';
  const days = isRtl ? DAYS_AR : DAYS_EN;
  const isMaxReached = activePendingCount >= maxPendingLimit;

  // Seat Lock automatic release on unmount
  useEffect(() => {
    return () => {
      if (lockedSessionId) {
        releaseSeatLock(lockedSessionId);
      }
    };
  }, [lockedSessionId]);

  const handleReserve = (sessionId: string) => {
    setErrorMessage(null);
    setWarningMessage(null);
    setSuccessMessage(null);
    setDuplicateCase1Info(null);
    setSelectedSessionId(sessionId);

    startTransition(async () => {
      // 1. Acquire Seat Lock first
      const lockRes = await acquireSeatLock(sessionId);
      if ('error' in lockRes) {
        setErrorMessage(lockRes.error);
        setSelectedSessionId(null);
        return;
      }

      setLockedSessionId(sessionId);

      // 2. Perform createReservation
      const res = await createReservation(sessionId);
      setLockedSessionId(null);

      if ('error' in res) {
        if (res.duplicateCase === 'CASE_1') {
          setDuplicateCase1Info(res.duplicateInfo);
        } else {
          setErrorMessage(res.error);
        }
      } else if (res.success) {
        if (res.warning) {
          setWarningMessage(res.warning);
        }
        setSuccessResNumber(res.reservationNumber || null);
        setSuccessMessage(
          res.message ||
            'Your reservation has been created successfully. Please visit the center within the configured reservation period to complete your payment. Reservations that are not confirmed before expiration will be cancelled automatically.'
        );
      }
      setSelectedSessionId(null);
    });
  };

  const handleJoinWaitingList = (sessionId: string) => {
    setErrorMessage(null);
    setWarningMessage(null);
    setSuccessMessage(null);
    setSelectedSessionId(sessionId);

    startTransition(async () => {
      const res = await joinWaitingList(sessionId);
      if ('error' in res) {
        setErrorMessage(res.error);
      } else if (res.success) {
        setSuccessMessage(res.message || 'You have successfully joined the waiting list.');
      }
      setSelectedSessionId(null);
    });
  };

  return (
    <div className="space-y-6" data-testid="reservation-page">
      {/* Active Pending Limit Warning */}
      {isMaxReached && (
        <div
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-700 dark:text-amber-400"
          data-testid="reservation-limit-warning"
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-xs sm:text-sm font-medium">
            <p className="font-bold">You already have two pending reservations.</p>
            <p className="text-muted-foreground text-[11px] sm:text-xs mt-0.5">
              Please complete payment for your existing pending reservations before creating new ones.
            </p>
          </div>
        </div>
      )}

      {/* Case 3 Warning Alert */}
      {warningMessage && (
        <div
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs sm:text-sm font-medium flex items-center justify-between"
          data-testid="duplicate-warning"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{warningMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setWarningMessage(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Global Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium flex items-center justify-between">
          <span>{errorMessage}</span>
          <Button variant="ghost" size="sm" onClick={() => setErrorMessage(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Case 1: Advanced Duplicate Student Error Modal */}
      <Dialog open={!!duplicateCase1Info} onOpenChange={() => setDuplicateCase1Info(null)}>
        <DialogContent className="max-w-md rounded-3xl" data-testid="duplicate-error">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 flex items-center justify-center mb-2 mx-auto">
              <UserX className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center font-bold text-base text-red-600">
              Student Already Registered
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              This student already exists with the same parent phone number.
            </DialogDescription>
          </DialogHeader>

          {duplicateCase1Info && (
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Student Name:</span>
                <span className="font-semibold text-foreground">{duplicateCase1Info.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parent Phone:</span>
                <span className="font-semibold text-foreground font-mono">{duplicateCase1Info.parentPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grade:</span>
                <span className="font-medium text-foreground">{duplicateCase1Info.grade || 'N/A'}</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              className="w-full rounded-xl gap-2 text-xs"
              onClick={() => setDuplicateCase1Info(null)}
            >
              Go To My Reservations
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl text-xs"
              onClick={() => setDuplicateCase1Info(null)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Payment Message Modal */}
      <Dialog open={!!successMessage} onOpenChange={() => setSuccessMessage(null)}>
        <DialogContent className="max-w-md rounded-3xl" data-testid="reservation-dialog">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 flex items-center justify-center mb-2 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center font-bold text-lg">Reservation Created!</DialogTitle>
            {successResNumber && (
              <p className="text-center text-xs font-mono font-bold text-primary" data-testid="reservation-number">
                {successResNumber}
              </p>
            )}
          </DialogHeader>
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 text-xs sm:text-sm text-center leading-relaxed text-muted-foreground">
            {successMessage}
          </div>
          <DialogFooter>
            <Button className="w-full rounded-xl" onClick={() => setSuccessMessage(null)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Available Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((ses) => {
          const cap = ses.capacity ?? 30;
          const resSeats = ses.reservedSeats ?? 0;
          const confSeats = ses.confirmedSeats ?? 0;
          const remainingSeats = Math.max(0, cap - (resSeats + confSeats));
          const isFull = remainingSeats <= 0;
          const isCurrentLoading = isPending && selectedSessionId === ses.id;
          const isLocked = lockedSessionId === ses.id;

          return (
            <Card
              key={ses.id}
              className={cn(
                "rounded-2xl border transition-all duration-200 hover:shadow-md",
                isFull ? "bg-muted/20 border-border/60" : "bg-card border-border/50"
              )}
              data-testid="session-card"
            >
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <CardTitle className="text-base font-bold">{ses.subject || 'General Session'}</CardTitle>
                  </div>
                  <CardDescription className="text-xs flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {ses.teacherName || 'Instructor'} • Grade: {ses.grade}
                  </CardDescription>
                </div>
                <Badge
                  variant={isFull ? 'destructive' : remainingSeats <= 5 ? 'outline' : 'secondary'}
                  className="rounded-full text-[11px] px-2.5 py-0.5"
                  data-testid="remaining-seats"
                >
                  {isFull ? 'Session Full' : `${remainingSeats} seats left`}
                </Badge>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{days[ses.dayOfWeek]} • {ses.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{ses.room || 'Main Room'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{ses.duration || '60 min'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{ses.price ?? 0} EGP</span>
                  </div>
                </div>

                {isLocked && (
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 text-xs flex items-center justify-between" data-testid="seat-lock">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Seat Temporarily Locked
                    </span>
                    <span className="font-mono font-bold text-[11px]" data-testid="seat-lock-countdown">30s</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {isFull ? (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl gap-2 text-xs"
                      onClick={() => handleJoinWaitingList(ses.id)}
                      disabled={isPending}
                      data-testid="waiting-list-button"
                    >
                      {isCurrentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4 text-amber-500" />}
                      Join Waiting List
                    </Button>
                  ) : (
                    <Button
                      className="w-full rounded-xl gap-2 text-xs font-semibold"
                      disabled={isMaxReached || isPending}
                      onClick={() => handleReserve(ses.id)}
                      data-testid="reserve-button"
                    >
                      {isCurrentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {isMaxReached ? 'Max Pending Reached' : 'Reserve Seat'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

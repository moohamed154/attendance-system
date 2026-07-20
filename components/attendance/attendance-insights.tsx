'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import dayjs from 'dayjs';

export function AttendanceInsights({ students, previousSession, dict }: any) {
  const d = dict.attendanceInsights || {};

  // Current Stats
  const total = students.length;
  const present = students.filter((s: any) => s.status === 'PRESENT').length;
  const absent = students.filter((s: any) => s.status === 'ABSENT').length;
  const late = students.filter((s: any) => s.status === 'LATE').length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  // Previous Stats
  let prevTotal = 0, prevPresent = 0, prevAbsent = 0, prevLate = 0, prevRate = 0;
  
  const returnedStudents: any[] = [];
  const newlyAbsentStudents: any[] = [];

  if (previousSession && previousSession.records) {
    const prevRecords = Object.values(previousSession.records) as string[];
    prevTotal = prevRecords.length;
    prevPresent = prevRecords.filter(s => s === 'PRESENT').length;
    prevAbsent = prevRecords.filter(s => s === 'ABSENT').length;
    prevLate = prevRecords.filter(s => s === 'LATE').length;
    prevRate = prevTotal > 0 ? Math.round(((prevPresent + prevLate) / prevTotal) * 100) : 0;

    for (const student of students) {
      const prevStatus = previousSession.records[student.id];
      if (!prevStatus) continue;

      if (prevStatus === 'ABSENT' && student.status === 'PRESENT') {
        returnedStudents.push(student);
      }
      if (prevStatus === 'PRESENT' && student.status === 'ABSENT') {
        newlyAbsentStudents.push(student);
      }
    }
  }

  const renderTrend = (current: number, previous: number, invertGood = false) => {
    if (!previousSession) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (current === previous) return <Minus className="w-4 h-4 text-muted-foreground" />;
    const isHigher = current > previous;
    const isGood = invertGood ? !isHigher : isHigher;
    
    return isHigher ? (
      <div className={`flex items-center text-xs font-medium ${isGood ? 'text-emerald-500' : 'text-rose-500'}`}>
        <TrendingUp className="w-3.5 h-3.5 mr-1 rtl:ml-1" />
        {current - previous}
      </div>
    ) : (
      <div className={`flex items-center text-xs font-medium ${isGood ? 'text-emerald-500' : 'text-rose-500'}`}>
        <TrendingDown className="w-3.5 h-3.5 mr-1 rtl:ml-1" />
        {previous - current}
      </div>
    );
  };

  return (
    <div className="space-y-4 mb-6">
      {/* 1. Summary Card & Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Summary */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{d.currentSession}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-end justify-between mb-4">
              <span className="text-4xl font-bold text-primary">{rate}%</span>
              <span className="text-xs text-muted-foreground font-medium bg-primary/10 px-2 py-1 rounded-full">{d.attendanceRate}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center justify-center p-2 bg-muted/20 rounded-xl">
                <Users className="w-4 h-4 text-muted-foreground mb-1" />
                <span className="text-lg font-semibold">{total}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-4 h-4 mb-1" />
                <span className="text-lg font-semibold">{present}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-rose-500/10 text-rose-600 rounded-xl">
                <XCircle className="w-4 h-4 mb-1" />
                <span className="text-lg font-semibold">{absent}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <Clock className="w-4 h-4 mb-1" />
                <span className="text-lg font-semibold">{late}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previous Comparison */}
        <Card className="shadow-sm border-border/50 bg-muted/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex justify-between">
              {d.previousSessionComparison}
              {previousSession && <span className="text-xs normal-case font-normal bg-background px-2 py-0.5 rounded border">{dayjs(previousSession.date).format('MMM D, YYYY')}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {!previousSession ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic py-8">
                {d.noPreviousAttendance}
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-bold text-muted-foreground">{prevRate}%</span>
                    {renderTrend(rate, prevRate)}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium bg-background border px-2 py-1 rounded-full">{d.attendanceRate}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 opacity-80">
                  <div className="flex flex-col items-center justify-center p-2 bg-background border rounded-xl">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-semibold">{prevTotal}</span>
                      {renderTrend(total, prevTotal)}
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 bg-background border rounded-xl">
                    <div className="flex items-center gap-1 text-emerald-600">
                      <span className="text-lg font-semibold">{prevPresent}</span>
                      {renderTrend(present, prevPresent)}
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 bg-background border rounded-xl">
                    <div className="flex items-center gap-1 text-rose-600">
                      <span className="text-lg font-semibold">{prevAbsent}</span>
                      {renderTrend(absent, prevAbsent, true)}
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 bg-background border rounded-xl">
                    <div className="flex items-center gap-1 text-amber-600">
                      <span className="text-lg font-semibold">{prevLate}</span>
                      {renderTrend(late, prevLate, true)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2 & 3. Widgets */}
      {previousSession && (returnedStudents.length > 0 || newlyAbsentStudents.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {returnedStudents.length > 0 && (
            <Card className="shadow-sm border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
              <div className="bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 flex justify-between">
                <span>{d.returnedAfterAbsence}</span>
                <span>{returnedStudents.length}</span>
              </div>
              <div className="divide-y divide-emerald-500/10">
                {returnedStudents.map(s => (
                  <div key={s.id} className="p-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm text-emerald-900 dark:text-emerald-300">{s.name}</div>
                      <div className="text-xs font-mono text-emerald-700/70 dark:text-emerald-400/70">{s.studentId}</div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {newlyAbsentStudents.length > 0 && (
            <Card className="shadow-sm border-rose-500/30 bg-rose-500/5 overflow-hidden">
              <div className="bg-rose-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 flex justify-between">
                <span>{d.newlyAbsent}</span>
                <span>{newlyAbsentStudents.length}</span>
              </div>
              <div className="divide-y divide-rose-500/10">
                {newlyAbsentStudents.map(s => (
                  <div key={s.id} className="p-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm text-rose-900 dark:text-rose-300">{s.name}</div>
                      <div className="text-xs font-mono text-rose-700/70 dark:text-rose-400/70">{s.studentId}</div>
                    </div>
                    <XCircle className="w-5 h-5 text-rose-500" />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

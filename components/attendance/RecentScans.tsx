'use client';

import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

export type ScanRecord = {
  id: string;
  studentName?: string;
  studentId?: string;
  time: string;
  status: 'success' | 'warning' | 'error';
  message: string;
};

interface RecentScansProps {
  scans: ScanRecord[];
  dict: any;
}

export function RecentScans({ scans, dict }: RecentScansProps) {
  const att = dict.attendance || {};

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {att.recentScans || 'Recent Scans'}
      </h3>

      <div className="divide-y divide-border/30">
        {scans.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6">
            {dict.emptyStates?.noData || 'No recent scans'}
          </div>
        ) : (
          scans.map((scan) => (
            <div key={scan.id} className="py-3 flex items-start justify-between gap-3 text-xs sm:text-sm w-full min-w-0">
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="shrink-0 mt-0.5">
                  {scan.status === 'success' && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    </div>
                  )}
                  {scan.status === 'warning' && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    </div>
                  )}
                  {scan.status === 'error' && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 whitespace-normal break-words">
                  {scan.studentName ? (
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground leading-snug whitespace-normal break-words">{scan.studentName}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground font-mono whitespace-normal break-words leading-relaxed">
                        ID: {scan.studentId} • {scan.message}
                      </p>
                    </div>
                  ) : (
                    <p className="font-medium text-foreground leading-snug whitespace-normal break-words">{scan.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground font-mono shrink-0 mt-1">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>{scan.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

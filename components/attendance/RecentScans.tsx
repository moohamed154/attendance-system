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
            <div key={scan.id} className="py-3 flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">
                  {scan.status === 'success' && (
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                  {scan.status === 'warning' && (
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}
                  {scan.status === 'error' && (
                    <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
                      <XCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  {scan.studentName ? (
                    <>
                      <p className="font-semibold text-foreground truncate">{scan.studentName}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        ID: {scan.studentId} • {scan.message}
                      </p>
                    </>
                  ) : (
                    <p className="font-medium text-foreground">{scan.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{scan.time}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

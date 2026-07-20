'use client';

interface AttendanceCounterProps {
  presentCount: number;
  totalCount: number;
  dict: any;
}

export function AttendanceCounter({ presentCount, totalCount, dict }: AttendanceCounterProps) {
  const percentage = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
  const att = dict.attendance || {};

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {att.totalPresent || 'Total Present'}
        </span>
        <span className="text-2xl font-extrabold text-foreground font-mono">
          {presentCount} <span className="text-muted-foreground text-sm font-normal">/ {totalCount}</span>
        </span>
      </div>

      <div className="w-full bg-muted dark:bg-muted/10 h-3 rounded-full overflow-hidden border border-border/20">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

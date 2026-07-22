'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, AlertCircle, User, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineEntry {
  id: string;
  oldStatus?: string | null;
  newStatus: string;
  changedById?: string | null;
  changedByRole?: string | null;
  reason?: string | null;
  createdAt: Date | string;
}

export function ReservationTimeline({
  history = [],
  reservedAt: _reservedAt,
  expiresAt: _expiresAt,
}: {
  history: TimelineEntry[];
  reservedAt?: Date | string;
  expiresAt?: Date | string;
}) {
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const statusIcons: Record<string, any> = {
    PENDING: Clock,
    CONFIRMED: CheckCircle2,
    CANCELLED: XCircle,
    EXPIRED: AlertCircle,
    COMPLETED: ShieldCheck,
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    CONFIRMED: 'bg-green-500/10 text-green-600 border-green-500/30',
    CANCELLED: 'bg-muted text-muted-foreground border-border',
    EXPIRED: 'bg-red-500/10 text-red-600 border-red-500/30',
    COMPLETED: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/50" data-testid="reservation-timeline">
      <h4 className="font-bold text-xs flex items-center gap-1.5 text-foreground">
        <Clock className="w-4 h-4 text-primary" /> Reservation Status Timeline
      </h4>

      {sortedHistory.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No timeline history recorded.</p>
      ) : (
        <div className="relative border-s border-border/60 ms-2 space-y-4 pt-1">
          {sortedHistory.map((item, idx) => {
            const Icon = statusIcons[item.newStatus] || Clock;
            const dateObj = new Date(item.createdAt);
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={item.id || idx} className="ms-4 relative" data-testid="timeline-item">
                <span className="absolute -left-[25px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border">
                  <Icon className="w-3 h-3 text-primary" />
                </span>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border", statusColors[item.newStatus])}
                    >
                      {item.newStatus}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {dateStr} at {timeStr}
                    </span>
                  </div>

                  <p className="text-xs text-foreground font-medium">
                    {item.reason || `Status changed to ${item.newStatus}`}
                  </p>

                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>Performed by: {item.changedByRole || 'System'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, HardDrive } from 'lucide-react';

export interface LocalSavedReservation {
  id: string;
  reservationNumber: string;
  status: string;
  reservedAt: string;
  expiresAt: string;
  subject?: string;
  teacherName?: string;
  sessionTime?: string;
  price?: number;
  lastSync?: string;
}

const LOCAL_STORAGE_KEY = 'reservation-local-history';

export function SavedReservationsLocalSync({
  serverReservations = [],
  onRestore,
}: {
  serverReservations?: any[];
  onRestore?: (items: LocalSavedReservation[]) => void;
}) {
  const [localItems, setLocalItems] = useState<LocalSavedReservation[]>([]);
  const [isSynced, setIsSynced] = useState<boolean>(false);

  // Sync server reservations into local storage automatically
  useEffect(() => {
    try {
      const storedRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      let existingLocal: LocalSavedReservation[] = storedRaw ? JSON.parse(storedRaw) : [];

      const serverMap = new Map(serverReservations.map((r) => [r.id, r]));
      const nowStr = new Date().toISOString();

      // Update existing local items with fresh server status
      existingLocal = existingLocal.map((item) => {
        const serverItem = serverMap.get(item.id);
        if (!serverItem) {
          return { ...item, status: 'NO_LONGER_AVAILABLE', lastSync: nowStr };
        }
        return {
          ...item,
          status: serverItem.status,
          reservedAt: serverItem.reservedAt,
          expiresAt: serverItem.expiresAt,
          lastSync: nowStr,
        };
      });

      // Add server items not currently in local storage
      const existingIds = new Set(existingLocal.map((item) => item.id));
      for (const res of serverReservations) {
        if (!existingIds.has(res.id)) {
          existingLocal.push({
            id: res.id,
            reservationNumber: res.reservationNumber,
            status: res.status,
            reservedAt: new Date(res.reservedAt).toISOString(),
            expiresAt: new Date(res.expiresAt).toISOString(),
            subject: res.session?.subject || 'General Session',
            teacherName: res.session?.teacherName || 'Instructor',
            sessionTime: `${res.session?.dayOfWeek ?? ''} ${res.session?.time ?? ''}`,
            price: res.session?.price ?? 0,
            lastSync: nowStr,
          });
        }
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existingLocal));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalItems(existingLocal);
      setIsSynced(true);
      if (onRestore) onRestore(existingLocal);
    } catch {
      // LocalStorage unsupported or blocked
    }
  }, [serverReservations, onRestore]);

  const handleClearLocalItem = (id: string) => {
    try {
      const updated = localItems.filter((i) => i.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setLocalItems(updated);
    } catch {
      // error handling
    }
  };

  const handleClearAll = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setLocalItems([]);
    } catch {
      // error handling
    }
  };

  if (localItems.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4 shadow-sm" data-testid="reservation-local-storage">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">My Saved Reservations (On Device)</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] gap-1" data-testid="reservation-sync">
            <RefreshCw className={`w-3 h-3 ${isSynced ? 'text-green-500' : ''}`} />
            Auto-Synced
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs text-muted-foreground hover:text-destructive">
            Clear Local
          </Button>
        </div>
      </div>

      <div className="space-y-2" data-testid="reservation-local-history">
        {localItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40 text-xs"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground font-mono">{item.reservationNumber}</span>
                <Badge
                  variant="outline"
                  className={
                    item.status === 'NO_LONGER_AVAILABLE'
                      ? 'bg-red-500/10 text-red-600'
                      : item.status === 'CONFIRMED'
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-amber-500/10 text-amber-600'
                  }
                >
                  {item.status === 'NO_LONGER_AVAILABLE' ? 'No longer available' : item.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {item.subject} • {item.teacherName}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => handleClearLocalItem(item.id)}
              title="Remove from device"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

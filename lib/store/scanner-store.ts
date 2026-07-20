import { create } from 'zustand';
import { ScanRecord } from '@/components/attendance/RecentScans';

interface ScannerState {
  recentScans: ScanRecord[];
  lastScan: ScanRecord | null;
  addScan: (scan: ScanRecord) => void;
  clearHistory: () => void;
}

export const useScannerStore = create<ScannerState>((set) => ({
  recentScans: [],
  lastScan: null,
  addScan: (scan) =>
    set((state) => ({
      lastScan: scan,
      recentScans: [scan, ...state.recentScans].slice(0, 5),
    })),
  clearHistory: () =>
    set({
      recentScans: [],
      lastScan: null,
    }),
}));

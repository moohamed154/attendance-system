'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Zap, VideoOff, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecentScans, ScanRecord } from './RecentScans';

interface StudentItem {
  id: string;
  studentId: string;
  name: string;
  status: string | null;
  paymentStatus?: string;
}

interface AttendanceScannerProps {
  sessionId: string;
  students: StudentItem[];
  onMarkPresent: (studentId: string) => void;
  dict: any;
}

let scanIdCounter = 0;
const generateScanId = () => `scan_${Date.now()}_${++scanIdCounter}`;

export function AttendanceScanner({ sessionId: _sessionId, students, onMarkPresent, dict }: AttendanceScannerProps) {
  const [loaded, setLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scanner, setScanner] = useState<any>(null);
  
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);
  const [lastScan, setLastScan] = useState<ScanRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processingRef = useRef(false);
  const att = dict.attendance || {};

  useEffect(() => {
    if ((window as any).Html5Qrcode) {
      setTimeout(() => setLoaded(true), 0);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html5-qrcode';
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Clean up script if unmounted before load
    };
  }, []);

  // Stop camera when leaving QR mode / unmounting
  useEffect(() => {
    return () => {
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [scanner]);

  const startScanning = async (mode = facingMode) => {
    if (!loaded) return;
    try {
      // If there is a running scanner, stop it first
      if (scanner) {
        await stopScanning();
      }

      const html5QrCode = new (window as any).Html5Qrcode("reader");
      await html5QrCode.start(
        { facingMode: mode },
        {
          fps: 10,
          qrbox: (width: number, height: number) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          }
        },
        (decodedText: string) => {
          handleQrScan(decodedText);
        },
        () => {} // Frame errors (ignore)
      );

      setScanner(html5QrCode);
      setIsScanning(true);

      // Check flash support
      const capabilities = html5QrCode.getRunningTrackCapabilities?.();
      setHasFlash(!!capabilities?.torch);
    } catch (err) {
      console.error("Camera start error: ", err);
    }
  };

  const stopScanning = async () => {
    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        // Already stopped
      }
      setScanner(null);
      setIsScanning(false);
      setFlashOn(false);
    }
  };

  const toggleFlash = async () => {
    if (!scanner || !hasFlash) return;
    try {
      const nextFlash = !flashOn;
      await scanner.applyVideoConstraints({
        advanced: [{ torch: nextFlash }]
      });
      setFlashOn(nextFlash);
    } catch {
      // Torch apply failed
    }
  };

  const switchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isScanning) {
      startScanning(nextMode);
    }
  };

  // Generate beep sound via Web Audio API (Offline & Instant)
  const playBeep = (type: 'success' | 'warning' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 pitch
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'warning') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 pitch
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3 low buzz
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.35);
      }
    } catch {
      // Audio context context interaction restrictions
    }
  };

  // Haptic feedback
  const triggerVibrate = (type: 'success' | 'warning' | 'error') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'success') {
        navigator.vibrate(80);
      } else if (type === 'warning') {
        navigator.vibrate([100, 50, 100]);
      } else {
        navigator.vibrate([200, 80, 200]);
      }
    }
  };

  // Main QR Processing
  const handleQrScan = (text: string) => {
    // Avoid double processing on concurrent frame matches
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const cleanText = text.trim();

    // Verify format: Numeric student ID lookup
    const student = students.find((s) => s.studentId === cleanText);
    const newScan: ScanRecord = {
      id: generateScanId(),
      time: timeStr,
      status: 'error',
      message: ''
    };

    if (!/^\d+$/.test(cleanText)) {
      newScan.status = 'error';
      newScan.message = att.scanInvalid || 'Invalid QR Code';
      finalizeScan(newScan);
      return;
    }

    if (!student) {
      newScan.status = 'error';
      newScan.message = att.scanNotEnrolled || 'Student not enrolled in this session';
      finalizeScan(newScan);
      return;
    }

    newScan.studentName = student.name;
    newScan.studentId = student.studentId;

    if (student.status === 'PRESENT') {
      newScan.status = 'warning';
      newScan.message = att.scanDuplicate || 'Already marked present';
      finalizeScan(newScan);
    } else {
      // Call markAttendance callback
      onMarkPresent(student.id);
      newScan.status = 'success';
      newScan.message = att.scanSuccess || 'Successfully marked present';
      finalizeScan(newScan);
    }
  };

  const finalizeScan = (scan: ScanRecord) => {
    // Sound & Haptics
    playBeep(scan.status);
    triggerVibrate(scan.status);

    // Update States
    setLastScan(scan);
    setRecentScans(prev => [scan, ...prev].slice(0, 5));

    // Cooldown logic
    setTimeout(() => {
      processingRef.current = false;
      setIsProcessing(false);
    }, 2000); // 2 second scan cooldown
  };

  return (
    <div className="grid gap-6 md:grid-cols-5 p-4 sm:p-6 bg-background">
      
      {/* Scanner Control Layout (Col: 3) */}
      <div className="md:col-span-3 space-y-6">
        
        {/* Camera Preview Box */}
        <div className="relative aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden border border-border/50 bg-black/95 flex flex-col items-center justify-center text-white shadow-inner">
          <div id="reader" className="absolute inset-0 w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />
          
          {/* Laser focus outline overlay */}
          {isScanning && !isProcessing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <div className="w-[60%] h-[60%] border-2 border-primary/60 rounded-3xl relative animate-pulse">
                {/* Scanner corner accents */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary -translate-x-1 -translate-y-1 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary translate-x-1 -translate-y-1 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary -translate-x-1 translate-y-1 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary translate-x-1 translate-y-1 rounded-br-xl" />
                <div className="absolute inset-x-0 top-1/2 h-[2px] bg-primary/70 shadow-[0_0_15px_#22c55e] animate-[bounce_2s_infinite]" />
              </div>
            </div>
          )}

          {/* Fallback Camera Off Overlay */}
          {!isScanning && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground z-10">
              <VideoOff className="w-12 h-12 stroke-[1.25]" />
              <p className="text-sm font-semibold tracking-tight">{att.scannerTitle || 'Scanner Stopped'}</p>
            </div>
          )}

          {/* Loader */}
          {!loaded && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-sm font-medium z-20">
              {dict.loadingStates?.loading || 'Loading...'}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-3">
          {!isScanning ? (
            <Button
              onClick={() => startScanning()}
              className="flex-1 min-w-[140px] h-12 rounded-xl text-sm font-bold shadow-md gap-2"
              disabled={!loaded}
            >
              <Camera className="w-4 h-4" />
              {att.startScanner || 'Start Scanner'}
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="destructive"
              className="flex-1 min-w-[140px] h-12 rounded-xl text-sm font-bold shadow-md gap-2"
            >
              <VideoOff className="w-4 h-4" />
              {att.stopScanner || 'Stop Scanner'}
            </Button>
          )}

          <Button
            onClick={switchCamera}
            variant="outline"
            className="w-12 h-12 rounded-xl border-border/50 bg-card p-0"
            disabled={!loaded}
            title={att.switchCamera}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {hasFlash && (
            <Button
              onClick={toggleFlash}
              variant="outline"
              className={cn("w-12 h-12 rounded-xl border-border/50 bg-card p-0", flashOn && "bg-yellow-500/10 text-yellow-600 border-yellow-500/30")}
              disabled={!isScanning}
              title={att.flashToggle}
            >
              <Zap className="w-4 h-4" />
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground leading-relaxed px-4">
          {att.scannerInstruction || "Place student's QR Code in front of the camera"}
        </p>
      </div>

      {/* Info Scan Logs (Col: 2) */}
      <div className="md:col-span-2 space-y-6">
        
        {/* Last Scan Status Alert */}
        {lastScan && (
          <div
            className={cn(
              "rounded-2xl border p-5 space-y-3 transition-all duration-300 transform scale-100",
              lastScan.status === 'success' && "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400",
              lastScan.status === 'warning' && "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400",
              lastScan.status === 'error' && "bg-destructive/10 border-destructive/20 text-destructive"
            )}
          >
            <div className="flex justify-between items-start gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                {att.scanStatus || 'Scan Result'}
              </span>
              <span className="text-[10px] font-mono opacity-60">{lastScan.time}</span>
            </div>

            <div className="flex gap-3 items-center">
              <div className="shrink-0">
                {lastScan.status === 'success' && <CheckCircle2 className="w-6 h-6" />}
                {lastScan.status === 'warning' && <AlertTriangle className="w-6 h-6" />}
                {lastScan.status === 'error' && <XCircle className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                {lastScan.studentName ? (
                  <>
                    <h4 className="font-extrabold truncate leading-tight">{lastScan.studentName}</h4>
                    <p className="text-sm font-semibold opacity-90 mt-0.5 truncate">{lastScan.message}</p>
                    <p className="text-[11px] opacity-75 font-mono mt-0.5">ID: {lastScan.studentId}</p>
                  </>
                ) : (
                  <h4 className="font-bold">{lastScan.message}</h4>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scan Log History */}
        <RecentScans scans={recentScans} dict={dict} />
      </div>

    </div>
  );
}

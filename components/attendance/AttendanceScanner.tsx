'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Zap, VideoOff, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RecentScans, ScanRecord } from './RecentScans';
import { useScannerStore } from '@/lib/store/scanner-store';

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
  isActive?: boolean;
}

let scanIdCounter = 0;
const generateScanId = () => `scan_${Date.now()}_${++scanIdCounter}`;

export function AttendanceScanner({ 
  sessionId, 
  students, 
  onMarkPresent, 
  dict
}: AttendanceScannerProps) {
  const [loaded, setLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  
  const { recentScans, lastScan, addScan, clearHistory } = useScannerStore();

  // Structured Logging & Error Handling
  const [logs, setLogs] = useState<string[]>([]);
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const addLog = (msg: string) => {
    console.log(`[Scanner] ${msg}`);
    // Defer state update to avoid synchronous setState inside render/useEffect hooks
    setTimeout(() => {
      setLogs(prev => [...prev, msg]);
    }, 0);
  };

  const processingRef = useRef(false);
  const initAttemptedRef = useRef(false);
  const scannerRef = useRef<any>(null);
  const lastScansRef = useRef<Record<string, number>>({});
  const att = dict.attendance || {};

  // Reset scans history when session changes
  useEffect(() => {
    setTimeout(() => {
      clearHistory();
    }, 0);
    lastScansRef.current = {};
  }, [sessionId, clearHistory]);

  // Dynamically load html5-qrcode local module client-only
  useEffect(() => {
    setTimeout(() => {
      addLog("STEP 1 - importing library locally");
    }, 0);
    import("html5-qrcode")
      .then(() => {
        setTimeout(() => {
          addLog("STEP 2 - library imported successfully");
          setLoaded(true);
        }, 0);
      })
      .catch((err) => {
        setTimeout(() => {
          addLog(`STEP 2 - library failed to import locally: ${err?.message || err}`);
          setInitError("Library failed to load");
        }, 0);
      });
  }, []);

  // Monitor loaded status and start scanner automatically if possible
  useEffect(() => {
    if (!loaded) return;

    if (!isScanning && !initError && !isInitializing && !initAttemptedRef.current) {
      setTimeout(() => {
        addLog("Scanner ready: starting camera stream");
      }, 0);
      initAttemptedRef.current = true;
      startScanning();
    }
  }, [loaded]);

  // Clean up scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        setTimeout(() => {
          addLog("Unmount: stopping and clearing scanner instance");
        }, 0);
        const instance = scannerRef.current;
        if (instance.isScanning) {
          instance.stop().catch(() => {});
        }
        scannerRef.current = null;
      }
    };
  }, []);

  // Helper to get or create html5-qrcode instance
  const getOrCreateScanner = async () => {
    if (scannerRef.current) {
      return scannerRef.current;
    }
    addLog("STEP 5 - creating scanner instance");
    const { Html5Qrcode } = await import("html5-qrcode");
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;
    return html5QrCode;
  };

  async function startScanning(mode = facingMode) {
    if (!loaded) {
      addLog("Cannot start: library not loaded");
      return;
    }

    setInitError(null);
    setIsInitializing(true);
    
    try {
      // Check browser capabilities and permissions
      addLog("STEP 3 - checking media devices & permissions");
      if (typeof window === 'undefined') return;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const isNotHttps = window.location.protocol !== 'https:' && 
                           window.location.hostname !== 'localhost' && 
                           window.location.hostname !== '127.0.0.1';
        const errMsg = isNotHttps 
          ? "Camera API not supported (requires HTTPS connection)" 
          : "Camera API not supported";
        throw new Error(errMsg);
      }

      // Verify container exists
      addLog("STEP 4 - verifying container element exists");
      const container = document.getElementById("reader");
      if (!container) {
        throw new Error("Scanner container element ('#reader') not found in DOM");
      }

      // Get scanner
      const html5QrCode = await getOrCreateScanner();

      // If scanner is already scanning, stop it first
      if (html5QrCode.isScanning) {
        addLog("Stopping existing active scanner");
        await html5QrCode.stop();
      }

      addLog("STEP 6 - getting cameras list");
      const { Html5Qrcode } = await import("html5-qrcode");
      const devices = await Html5Qrcode.getCameras();
      
      addLog(`STEP 7 - cameras found: ${devices?.length || 0}`);
      if (!devices || devices.length === 0) {
        throw new Error("No cameras found");
      }

      addLog("STEP 8 - starting camera stream");
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

      addLog("STEP 9 - scanner started successfully");
      setIsScanning(true);

      // Check flash support
      const capabilities = html5QrCode.getRunningTrackCapabilities?.();
      setHasFlash(!!(capabilities as any)?.torch);
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      addLog(`Scanner initialization failed: ${errMsg}`);
      
      if (errMsg.includes("NotAllowedError") || errMsg.includes("Permission denied")) {
        setInitError("Permission denied");
      } else if (errMsg.includes("NotFoundError") || errMsg.includes("No cameras found") || errMsg.includes("Requested device not found")) {
        setInitError("No cameras found");
      } else if (errMsg.includes("NotReadableError") || errMsg.includes("Could not start video source")) {
        setInitError("Camera is already in use by another application");
      } else if (errMsg.includes("Camera API not supported")) {
        setInitError(errMsg);
      } else {
        setInitError(`Scanner initialization failed: ${errMsg}`);
      }
    } finally {
      setIsInitializing(false);
    }
  }

  async function stopScanning() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Already stopped
      }
      setIsScanning(false);
      setFlashOn(false);
      initAttemptedRef.current = false;
    }
  }

  async function toggleFlash() {
    if (!scannerRef.current || !hasFlash) return;
    try {
      const nextFlash = !flashOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextFlash }]
      });
      setFlashOn(nextFlash);
    } catch {
      // Torch apply failed
    }
  }

  function switchCamera() {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isScanning) {
      startScanning(nextMode);
    }
  }

  // Generate beep sound via Web Audio API (Offline & Instant)
  function playBeep(type: 'success' | 'warning' | 'error') {
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
  }

  // Haptic feedback
  function triggerVibrate(type: 'success' | 'warning' | 'error') {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'success') {
        navigator.vibrate(80);
      } else if (type === 'warning') {
        navigator.vibrate([100, 50, 100]);
      } else {
        navigator.vibrate([200, 80, 200]);
      }
    }
  }

  // Main QR Processing
  function handleQrScan(text: string) {
    // Avoid double processing on concurrent frame matches
    if (processingRef.current) return;
    processingRef.current = true;
    
    // Set a short global lock (200ms) to prevent frame double-fires
    setTimeout(() => {
      processingRef.current = false;
    }, 200);

    const cleanText = text.trim();
    const now = Date.now();
    const lastScanTime = lastScansRef.current[cleanText] || 0;
    
    // Ignore duplicate scan of the same student within 3 seconds
    if (now - lastScanTime < 3000) {
      return;
    }
    
    // Store the timestamp to prevent duplicate read of the same student/code
    lastScansRef.current[cleanText] = now;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

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
  }

  function finalizeScan(scan: ScanRecord) {
    // Sound & Haptics
    playBeep(scan.status);
    triggerVibrate(scan.status);

    // Update Global Store
    addScan(scan);
  }

  return (
    <div className="grid gap-6 md:grid-cols-5 p-4 sm:p-6 bg-background" data-testid="attendance-scanner">
      <div className="md:col-span-3 space-y-6">
        <div className="relative aspect-square sm:aspect-[4/3] rounded-3xl overflow-hidden border border-border/50 bg-black/95 flex flex-col items-center justify-center text-white shadow-inner">
          <div id="reader" className="absolute inset-0 w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" data-testid="scanner-video" />
          
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10" data-testid="scanner-overlay">
              <div className="w-[60%] h-[60%] border-2 border-primary/60 rounded-3xl relative animate-pulse">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary -translate-x-1 -translate-y-1 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary translate-x-1 -translate-y-1 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary -translate-x-1 translate-y-1 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary translate-x-1 translate-y-1 rounded-br-xl" />
                <div className="absolute inset-x-0 top-1/2 h-[2px] bg-primary/70 shadow-[0_0_15px_#22c55e] animate-[bounce_2s_infinite]" />
              </div>
            </div>
          )}

          {!isScanning && !isInitializing && !initError && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground z-10">
              <VideoOff className="w-12 h-12 stroke-[1.25]" />
              <p className="text-sm font-semibold tracking-tight">{att.scannerTitle || 'Scanner Stopped'}</p>
            </div>
          )}

          {!loaded && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center text-sm font-medium z-20 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p>{logs[logs.length - 1] || (dict.loadingStates?.loading || 'Loading...')}</p>
            </div>
          )}

          {loaded && isInitializing && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center text-sm font-medium z-20 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-xs text-muted-foreground font-mono max-w-[80%] truncate">
                {logs[logs.length - 1]}
              </p>
            </div>
          )}

          {initError && (
            <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center p-6 text-center text-white z-30 space-y-4">
              <XCircle className="w-12 h-12 text-red-500" />
              <div>
                <h4 className="font-bold text-lg">{dict.attendance?.scannerError || 'Scanner Error'}</h4>
                <p className="text-sm text-red-200 mt-1 max-w-[85%] mx-auto">{initError}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-transparent hover:bg-white/10 text-white border-white/20 rounded-xl"
                onClick={() => startScanning()}
              >
                {dict.attendance?.retry || 'Retry'}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {!isScanning ? (
            <Button
              onClick={() => startScanning()}
              className="flex-1 min-w-[140px] h-12 rounded-xl text-sm font-bold shadow-md gap-2"
              disabled={!loaded || isInitializing}
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
              "rounded-2xl border p-3 sm:p-5 space-y-3 transition-all duration-300 transform scale-100 w-full max-w-full break-words text-sm sm:text-base",
              lastScan.status === 'success' && "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400",
              lastScan.status === 'warning' && "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400",
              lastScan.status === 'error' && "bg-destructive/10 border-destructive/20 text-destructive"
            )}
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                {att.scanStatus || 'Scan Result'}
              </span>
              <span className="text-[10px] font-mono opacity-60 shrink-0">{lastScan.time}</span>
            </div>

            <div className="flex gap-2 sm:gap-3 items-start">
              <div className="shrink-0 mt-0.5">
                {lastScan.status === 'success' && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />}
                {lastScan.status === 'warning' && <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />}
                {lastScan.status === 'error' && <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />}
              </div>
              <div className="min-w-0 flex-1 whitespace-normal break-words">
                {lastScan.studentName ? (
                  <div className="space-y-1">
                    <h4 className="font-extrabold leading-tight text-sm sm:text-base whitespace-normal break-words">{lastScan.studentName}</h4>
                    <p className="text-xs sm:text-sm font-semibold opacity-90 leading-snug whitespace-normal break-words">{lastScan.message}</p>
                    <p className="text-[10px] sm:text-[11px] opacity-75 font-mono block">ID: {lastScan.studentId}</p>
                  </div>
                ) : (
                  <h4 className="font-bold leading-tight text-sm sm:text-base whitespace-normal break-words">{lastScan.message}</h4>
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

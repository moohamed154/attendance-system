'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { validateAndScanReservationQR, confirmPayment } from '@/actions/reservations/reservations';
import { ReservationTimeline } from './ReservationTimeline';
import {
  QrCode,
  Scan,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  User,
  Phone,
  Camera,
  Keyboard,
  RefreshCw,
  Zap,
  VideoOff,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminQRScannerModal({ locale = 'ar' }: { locale?: string }) {
  const isAr = locale === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [tokenInput, setTokenInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const [scanResult, setScanResult] = useState<any>(null);
  const [scanResultCode, setScanResultCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Camera Scanner States
  const [cameraLoaded, setCameraLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<any>(null);
  const processingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamically load html5-qrcode
  useEffect(() => {
    import('html5-qrcode')
      .then(() => setCameraLoaded(true))
      .catch(() => setCameraError(isAr ? 'فشل تحميل مكتبة المسح' : 'Failed to load scanner library'));
  }, [isAr]);

  // Start / Stop camera based on modal open and active tab
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && cameraLoaded) {
      const timer = setTimeout(() => {
        startCameraScanning();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCameraScanning();
      };
    } else {
      stopCameraScanning();
    }
  }, [isOpen, activeTab, cameraLoaded]);

  // Audio Beep generator
  function playBeep(type: 'success' | 'warning' | 'error') {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(330, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25);
      }
    } catch {
      // Audio context policy
    }
  }

  // Haptic feedback
  function triggerVibrate(type: 'success' | 'error') {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'success') {
        navigator.vibrate(80);
      } else {
        navigator.vibrate([150, 50, 150]);
      }
    }
  }

  async function startCameraScanning(mode = facingMode) {
    setCameraError(null);
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error(isAr ? 'الكاميرا غير مدعومة في هذا المتصفح' : 'Camera API not supported');
      }

      const container = document.getElementById('admin-reservation-qr-reader');
      if (!container) return;

      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode('admin-reservation-qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: mode },
        {
          fps: 20,
          qrbox: (width: number, height: number) => {
            const size = Math.floor(Math.min(width, height) * 0.85);
            return { width: Math.max(size, 200), height: Math.max(size, 200) };
          },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          handleAutoCameraScan(decodedText);
        },
        () => {}
      );

      setIsScanning(true);
      const capabilities = html5QrCode.getRunningTrackCapabilities?.();
      setHasFlash(!!(capabilities as any)?.torch);
    } catch (err: any) {
      setIsScanning(false);
      setCameraError(err?.message || (isAr ? 'فشل فتح الكاميرا' : 'Camera initialization failed'));
    }
  }

  async function stopCameraScanning() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore
      }
      scannerRef.current = null;
      setIsScanning(false);
      setFlashOn(false);
    }
  }

  function switchCamera() {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCameraScanning(nextMode);
  }

  async function toggleFlash() {
    if (!scannerRef.current || !hasFlash) return;
    try {
      const nextFlash = !flashOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextFlash }],
      });
      setFlashOn(nextFlash);
    } catch {
      // ignore
    }
  }

  function handleAutoCameraScan(text: string) {
    if (processingRef.current) return;
    const cleanText = text.trim();
    if (!cleanText) return;

    processingRef.current = true;
    setTokenInput(cleanText);

    setTimeout(() => {
      processingRef.current = false;
    }, 1200);

    performValidation(cleanText);
  }

  // Handle Image File Scan (Upload ticket photo or screenshot)
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      setErrorMsg(null);
      setSuccessMsg(null);

      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('admin-reservation-qr-reader-file');
      const decodedText = await html5QrCode.scanFile(file, true);
      setTokenInput(decodedText);
      performValidation(decodedText);
    } catch (_err) {
      setErrorMsg(isAr ? 'لم يتم العثور على كود QR صالح في الصورة المحددة' : 'No valid QR code found in selected image');
      playBeep('error');
    }
  }

  const handleManualScan = () => {
    if (!tokenInput.trim()) return;
    performValidation(tokenInput.trim());
  };

  function performValidation(inputVal: string) {
    setErrorMsg(null);
    setSuccessMsg(null);
    setScanResult(null);
    setScanResultCode(null);

    startTransition(async () => {
      const res = await validateAndScanReservationQR(inputVal);
      if (res.scanResult) {
        setScanResultCode(res.scanResult);
      }

      if (res.error) {
        setErrorMsg(res.error);
        playBeep('error');
        triggerVibrate('error');
      } else {
        playBeep('success');
        triggerVibrate('success');
      }

      if (res.reservation) {
        setScanResult(res.reservation);
      }
    });
  }

  const handleConfirmPaymentInScanner = (reservationId: string) => {
    startTransition(async () => {
      const res = await confirmPayment(reservationId, 'Confirmed via Admin QR Scanner');
      if ('error' in res) {
        setErrorMsg(res.error);
        playBeep('error');
      } else {
        setSuccessMsg(isAr ? 'تم تأكيد دفع الحجز بنجاح!' : 'Payment confirmed successfully!');
        setScanResultCode('ALREADY_CONFIRMED');
        playBeep('success');
        triggerVibrate('success');
        if (scanResult) {
          setScanResult({ ...scanResult, status: 'CONFIRMED' });
        }
      }
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setScanResult(null);
          setScanResultCode(null);
          setErrorMsg(null);
          setSuccessMsg(null);
          setTokenInput('');
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl" data-testid="reservation-qr-scanner">
          <Scan className="w-4 h-4" />
          <span>{isAr ? 'مسح QR الحجز' : 'Scan Reservation QR'}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg rounded-3xl p-6 max-h-[92vh] overflow-y-auto" data-testid="reservation-scanner-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-base">
            <QrCode className="w-5 h-5 text-primary" />
            <span>{isAr ? 'ماسح تذاكر الحجز الإلكتروني' : 'Admin Reservation QR Scanner'}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Hidden Container for File Scan */}
        <div id="admin-reservation-qr-reader-file" className="hidden" />

        {/* Mode Switcher Tabs */}
        <div className="flex bg-muted p-1 rounded-2xl gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={cn(
              'flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors',
              activeTab === 'camera'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isAr ? 'كاميرا' : 'Camera'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={cn(
              'flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors',
              activeTab === 'upload'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isAr ? 'رفع صورة' : 'Upload Image'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={cn(
              'flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors',
              activeTab === 'manual'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{isAr ? 'إدخال يدوي' : 'Manual'}</span>
          </button>
        </div>

        <div className="space-y-4 pt-2">
          {/* TAB 1: CAMERA SCANNER */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-center border border-border/60 shadow-inner">
                <div
                  id="admin-reservation-qr-reader"
                  className="absolute inset-0 w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
                />

                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    <div className="w-[65%] h-[65%] border-2 border-primary/70 rounded-2xl relative animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                      <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-primary -translate-x-1 -translate-y-1 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-primary translate-x-1 -translate-y-1 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-primary -translate-x-1 translate-y-1 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-primary translate-x-1 translate-y-1 rounded-br-lg" />
                      <div className="absolute inset-x-0 top-1/2 h-[2px] bg-primary/80 shadow-[0_0_10px_#22c55e] animate-bounce" />
                    </div>
                  </div>
                )}

                {!isScanning && !cameraError && (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground z-10">
                    <VideoOff className="w-10 h-10 stroke-[1.25]" />
                    <p className="text-xs font-semibold">{isAr ? 'الكاميرا متوقفة' : 'Camera Stopped'}</p>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 bg-destructive/90 text-destructive-foreground flex flex-col items-center justify-center p-4 text-center z-20 space-y-2">
                    <XCircle className="w-10 h-10" />
                    <p className="text-xs font-medium">{cameraError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startCameraScanning()}
                      className="bg-transparent border-white/20 text-white hover:bg-white/10 rounded-xl"
                    >
                      {isAr ? 'إعادة المحاولة' : 'Retry'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex items-center gap-2">
                {!isScanning ? (
                  <Button
                    onClick={() => startCameraScanning()}
                    className="flex-1 rounded-xl text-xs font-semibold gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isAr ? 'تشغيل الكاميرا' : 'Start Camera'}</span>
                  </Button>
                ) : (
                  <Button
                    onClick={stopCameraScanning}
                    variant="destructive"
                    className="flex-1 rounded-xl text-xs font-semibold gap-2"
                  >
                    <VideoOff className="w-4 h-4" />
                    <span>{isAr ? 'إيقاف الكاميرا' : 'Stop Camera'}</span>
                  </Button>
                )}

                <Button
                  onClick={switchCamera}
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-border shrink-0"
                  title={isAr ? 'تبديل الكاميرا' : 'Switch Camera'}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>

                {hasFlash && (
                  <Button
                    onClick={toggleFlash}
                    variant="outline"
                    size="icon"
                    className={cn('rounded-xl border-border shrink-0', flashOn && 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30')}
                    title={isAr ? 'الفلاش' : 'Flash Torch'}
                  >
                    <Zap className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE SCANNER */}
          {activeTab === 'upload' && (
            <div className="space-y-3 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary/80 bg-primary/5 cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 group"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm">
                  {isAr ? 'اضغط لاختيار صورة التذكرة أو كود QR' : 'Click to select ticket image or QR code photo'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'تدعم الصور بصيغ PNG, JPG, WEBP' : 'Supports PNG, JPG, WEBP formats'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL CHECK */}
          {activeTab === 'manual' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder={
                    isAr
                      ? 'أدخل رقم الحجز (RES-2026...) أو الكود (4F8K-92LM)'
                      : 'Type Reservation # (RES-2026...) or Tracking Code'
                  }
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="rounded-xl text-xs font-mono"
                  data-testid="reservation-scanner-input"
                />
                <Button
                  onClick={handleManualScan}
                  disabled={isPending || !tokenInput.trim()}
                  className="rounded-xl shrink-0 gap-1.5"
                  data-testid="reservation-scanner-submit"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{isAr ? 'تحقق' : 'Validate'}</span>}
                </Button>
              </div>
            </div>
          )}

          {/* Invalid Signature Banner */}
          {scanResultCode === 'INVALID_SIGNATURE' && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-center gap-2 font-bold" data-testid="qr-invalid">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{isAr ? 'تذكرة الحجز غير صالحة أو التوقيع الإلكتروني تالف.' : 'Invalid Reservation QR token signature.'}</span>
            </div>
          )}

          {/* Error / Replay Protection Banners */}
          {errorMsg && scanResultCode !== 'INVALID_SIGNATURE' && (
            <div
              className={cn(
                'p-3 rounded-xl border text-xs flex items-center gap-2 font-medium',
                scanResultCode === 'ALREADY_CONFIRMED'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                  : 'bg-red-500/10 border-red-500/30 text-red-600'
              )}
              data-testid="scan-status"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {scanResultCode === 'ALREADY_CONFIRMED'
                  ? isAr
                    ? 'هذا الحجز مؤكد بالفعل مسبقاً.'
                    : 'This reservation has already been confirmed.'
                  : scanResultCode === 'EXPIRED'
                  ? isAr
                    ? 'هذا الحجز منتهي الصلاحية.'
                    : 'This reservation has expired.'
                  : scanResultCode === 'CANCELLED'
                  ? isAr
                    ? 'هذا الحجز ملغى.'
                    : 'This reservation is cancelled.'
                  : errorMsg}
              </span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-600 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Scanned Reservation Result Details */}
          {scanResult && (
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-4" data-testid="scan-result">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-[11px] text-muted-foreground font-mono font-bold" data-testid="reservation-number">
                    {scanResult.reservationNumber}
                  </span>
                  <h4 className="font-bold text-sm">{scanResult.student?.name}</h4>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full border',
                    scanResult.status === 'CONFIRMED'
                      ? 'bg-green-500/10 text-green-600 border-green-500/30'
                      : scanResult.status === 'PENDING'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      : 'bg-red-500/10 text-red-600 border-red-500/30'
                  )}
                >
                  {scanResult.status === 'CONFIRMED'
                    ? isAr ? 'مؤكد' : 'CONFIRMED'
                    : scanResult.status === 'PENDING'
                    ? isAr ? 'قيد الانتظار' : 'PENDING'
                    : scanResult.status === 'CANCELLED'
                    ? isAr ? 'ملغى' : 'CANCELLED'
                    : scanResult.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="space-y-0.5">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {isAr ? 'كود الطالب:' : 'Student ID:'}</span>
                  <p className="font-semibold text-foreground">{scanResult.student?.studentId}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {isAr ? 'هاتف ولي الأمر:' : 'Parent Phone:'}</span>
                  <p className="font-semibold text-foreground font-mono">{scanResult.student?.parentPhone || scanResult.student?.studentPhone || 'N/A'}</p>
                </div>

                <div className="space-y-0.5">
                  <span>{isAr ? 'المادة:' : 'Subject:'}</span>
                  <p className="font-semibold text-foreground">{scanResult.session?.subject || 'General'}</p>
                </div>

                <div className="space-y-0.5">
                  <span>{isAr ? 'المعلم:' : 'Teacher:'}</span>
                  <p className="font-medium text-foreground">{scanResult.session?.teacherName || 'Instructor'}</p>
                </div>

                <div className="space-y-0.5">
                  <span>{isAr ? 'الصف الدراسي:' : 'Grade:'}</span>
                  <p className="font-medium text-foreground">{scanResult.session?.grade}</p>
                </div>

                <div className="space-y-0.5">
                  <span>{isAr ? 'الموعد والقاعة:' : 'Schedule:'}</span>
                  <p className="font-medium text-foreground">{scanResult.session?.time} • {scanResult.session?.room || 'Room 1'}</p>
                </div>
              </div>

              {scanResult.status === 'PENDING' && (
                <Button
                  className="w-full rounded-xl gap-2 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white shadow-md"
                  onClick={() => handleConfirmPaymentInScanner(scanResult.id)}
                  disabled={isPending}
                  data-testid="confirm-payment-button"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{isAr ? 'تأكيد الدفع وحجز المقعد الآن' : 'Confirm Payment & Lock Seat Now'}</span>
                </Button>
              )}

              {/* Status Timeline */}
              {scanResult.history && scanResult.history.length > 0 && (
                <ReservationTimeline history={scanResult.history} />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

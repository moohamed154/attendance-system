'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { validateAndScanReservationQR, confirmPayment } from '@/actions/reservations/reservations';
import { ReservationTimeline } from './ReservationTimeline';
import { QrCode, Scan, CheckCircle2, XCircle, AlertCircle, Loader2, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminQRScannerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanResultCode, setScanResultCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleScan = () => {
    if (!tokenInput.trim()) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setScanResult(null);
    setScanResultCode(null);

    startTransition(async () => {
      const res = await validateAndScanReservationQR(tokenInput.trim());
      if (res.scanResult) {
        setScanResultCode(res.scanResult);
      }
      if (res.error) {
        setErrorMsg(res.error);
      }
      if (res.reservation) {
        setScanResult(res.reservation);
      }
    });
  };

  const handleConfirmPaymentInScanner = (reservationId: string) => {
    startTransition(async () => {
      const res = await confirmPayment(reservationId, 'Confirmed via Admin QR Scanner');
      if ('error' in res) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Payment confirmed successfully!');
        setScanResultCode('ALREADY_CONFIRMED');
        if (scanResult) {
          setScanResult({ ...scanResult, status: 'CONFIRMED' });
        }
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl" data-testid="reservation-qr-scanner">
          <Scan className="w-4 h-4" /> Scan Reservation QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-3xl" data-testid="reservation-scanner-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-base">
            <QrCode className="w-5 h-5 text-primary" /> Admin Reservation QR Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* QR Token / Number Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Scan QR signature or type Reservation # (RES-2026...)"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="rounded-xl text-xs font-mono"
              data-testid="reservation-scanner-input"
            />
            <Button
              onClick={handleScan}
              disabled={isPending || !tokenInput.trim()}
              className="rounded-xl shrink-0"
              data-testid="reservation-scanner-submit"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Validate'}
            </Button>
          </div>

          {/* Invalid Signature Banner */}
          {scanResultCode === 'INVALID_SIGNATURE' && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-center gap-2 font-bold" data-testid="qr-invalid">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>Invalid Reservation QR.</span>
            </div>
          )}

          {/* Error / Replay Protection Banners */}
          {errorMsg && scanResultCode !== 'INVALID_SIGNATURE' && (
            <div
              className={cn(
                "p-3 rounded-xl border text-xs flex items-center gap-2 font-medium",
                scanResultCode === 'ALREADY_CONFIRMED'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                  : 'bg-red-500/10 border-red-500/30 text-red-600'
              )}
              data-testid="scan-status"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
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
                    "text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full border",
                    scanResult.status === 'CONFIRMED'
                      ? 'bg-green-500/10 text-green-600 border-green-500/30'
                      : scanResult.status === 'PENDING'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      : 'bg-red-500/10 text-red-600 border-red-500/30'
                  )}
                >
                  {scanResult.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="space-y-0.5">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> Student ID:</span>
                  <p className="font-semibold text-foreground">{scanResult.student?.studentId}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Parent Phone:</span>
                  <p className="font-semibold text-foreground font-mono">{scanResult.student?.parentPhone || scanResult.student?.studentPhone || 'N/A'}</p>
                </div>

                <div className="space-y-0.5">
                  <span>Subject:</span>
                  <p className="font-semibold text-foreground">{scanResult.session?.subject || 'General'}</p>
                </div>

                <div className="space-y-0.5">
                  <span>Teacher:</span>
                  <p className="font-medium text-foreground">{scanResult.session?.teacherName || 'Instructor'}</p>
                </div>

                <div className="space-y-0.5">
                  <span>Grade:</span>
                  <p className="font-medium text-foreground">{scanResult.session?.grade}</p>
                </div>

                <div className="space-y-0.5">
                  <span>Session Time:</span>
                  <p className="font-medium text-foreground">{scanResult.session?.time}</p>
                </div>
              </div>

              {scanResult.status === 'PENDING' && (
                <Button
                  className="w-full rounded-xl gap-2 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleConfirmPaymentInScanner(scanResult.id)}
                  disabled={isPending}
                  data-testid="confirm-payment-button"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm Payment Now
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

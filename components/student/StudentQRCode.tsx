'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentQRCodeProps {
  value: string;
  studentName: string;
  dict: any;
}

export function StudentQRCode({ value, studentName, dict }: StudentQRCodeProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const sp = dict.studentPortal || {};

  useEffect(() => {
    QRCode.toDataURL(value, {
      margin: 2,
      width: 400,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrUrl(url))
      .catch(() => {});
  }, [value]);

  const handleDownload = () => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QR_${studentName.replace(/\s+/g, '_')}_${value}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="border-4 border-primary/10 rounded-3xl p-3 bg-white shadow-sm flex items-center justify-center">
        {qrUrl ? (
          <img src={qrUrl} alt={`QR Code for ${value}`} className="w-48 h-48 md:w-56 md:h-56" />
        ) : (
          <div className="w-48 h-48 md:w-56 md:h-56 bg-muted animate-pulse rounded-2xl" />
        )}
      </div>

      <div className="flex gap-3 print:hidden">
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          className="rounded-xl h-10 gap-2 border-border/50 text-sm font-semibold"
          disabled={!qrUrl}
        >
          <Download className="w-4 h-4" />
          {sp.downloadQR || 'Download QR'}
        </Button>
      </div>
    </div>
  );
}

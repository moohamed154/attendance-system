'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function StudentQRCode({ value }: { value: string }) {
  const [qrUrl, setQrUrl] = useState<string>('');

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

  return (
    <div className="flex flex-col items-center space-y-4 shrink-0">
      <div className="border-4 border-primary/10 rounded-3xl p-3 bg-white shadow-sm flex items-center justify-center shrink-0">
        {qrUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={qrUrl} alt={`QR Code for ${value}`} className="w-48 h-48 md:w-56 md:h-56" />
        ) : (
          <div className="w-48 h-48 md:w-56 md:h-56 bg-muted animate-pulse rounded-2xl shrink-0" />
        )}
      </div>
    </div>
  );
}

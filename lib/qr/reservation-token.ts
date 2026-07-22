import crypto from 'crypto';

const SECRET_KEY = process.env.STUDENT_CARD_SECRET || process.env.JWT_SECRET || 'stable-reservation-qr-secret-2026';

export interface ReservationQRPayload {
  reservationId: string;
  reservationNumber: string;
  studentId: string;
  sessionId: string;
  status: string;
  timestamp: number;
}

export function generateReservationQRToken(payload: ReservationQRPayload): string {
  const hmac = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payload.reservationNumber)
    .digest('hex')
    .slice(0, 12);
  return `RESQR:${payload.reservationNumber}.${hmac}`;
}

export function verifyReservationQRToken(token: string): ReservationQRPayload | null {
  try {
    if (!token || !token.startsWith('RESQR:')) return null;
    const cleanToken = token.slice(6);
    const [resNum, hmac] = cleanToken.split('.');
    if (!resNum || !hmac) return null;

    const expectedHmac = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(resNum)
      .digest('hex')
      .slice(0, 12);

    if (hmac.toLowerCase() === expectedHmac.toLowerCase()) {
      return {
        reservationId: resNum,
        reservationNumber: resNum,
        studentId: '',
        sessionId: '',
        status: 'PENDING',
        timestamp: Date.now(),
      };
    }

    // Fallback: If token had legacy base64 payload format
    if (cleanToken.includes('.')) {
      const parts = cleanToken.split('.');
      if (parts.length === 2) {
        const [base64Data, oldHmac] = parts;
        const dataString = Buffer.from(base64Data, 'base64url').toString('utf8');
        const expectedOldHmac = crypto.createHmac('sha256', SECRET_KEY).update(dataString).digest('hex');
        if (oldHmac === expectedOldHmac) {
          const parsed = JSON.parse(dataString);
          return {
            reservationId: parsed.rId || parsed.num,
            reservationNumber: parsed.num || parsed.rId,
            studentId: parsed.sId || '',
            sessionId: parsed.sesId || '',
            status: parsed.st || 'PENDING',
            timestamp: parsed.ts || Date.now(),
          };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

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
  const dataString = JSON.stringify({
    rId: payload.reservationId,
    num: payload.reservationNumber,
    sId: payload.studentId,
    sesId: payload.sessionId,
    st: payload.status,
    ts: payload.timestamp,
  });

  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(dataString).digest('hex');
  const base64Data = Buffer.from(dataString).toString('base64url');

  return `RESQR:${base64Data}.${hmac}`;
}

export function verifyReservationQRToken(token: string): ReservationQRPayload | null {
  try {
    if (!token || !token.startsWith('RESQR:')) return null;
    const cleanToken = token.slice(6);
    const [base64Data, hmac] = cleanToken.split('.');
    if (!base64Data || !hmac) return null;

    const dataString = Buffer.from(base64Data, 'base64url').toString('utf8');
    const expectedHmac = crypto.createHmac('sha256', SECRET_KEY).update(dataString).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
      const parsed = JSON.parse(dataString);
      return {
        reservationId: parsed.rId,
        reservationNumber: parsed.num,
        studentId: parsed.sId,
        sessionId: parsed.sesId,
        status: parsed.st,
        timestamp: parsed.ts,
      };
    }
    return null;
  } catch {
    return null;
  }
}

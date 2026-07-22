# Disaster Recovery Plan

## Scenario Matrix & Action Steps

### 1. Database Connection Failure
- **Symptom**: `/api/health/db` returns HTTP 503 `UNHEALTHY`.
- **Action**: Check `DATABASE_URL` in `.env`. Inspect Neon connection pooling. Fallback to backup replica if primary pooler fails.

### 2. Scheduler & Overdue Expiration Failure
- **Symptom**: Overdue pending reservations remain unexpired.
- **Action**: Trigger manual HTTP request to `/api/scheduler/expire-reservations` or execute `expirePendingReservations()` server action.

### 3. QR Token Verification Failure
- **Symptom**: Admin QR scanner displays invalid signature for legitimate QR tickets.
- **Action**: Verify `STUDENT_CARD_SECRET` / `JWT_SECRET` environment variable consistency. If secret changed, Admin can look up by Reservation Number (`RES-YYYYMMDD-XXXXXX`) directly.

### 4. Cache & Revalidation Invalidation
- **Symptom**: Stale reservation status or seat counts displayed.
- **Action**: Trigger Next.js tag revalidation `revalidateTag('reservations')` or restart the node server.

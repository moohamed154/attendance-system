# PostgreSQL Database Backup Strategy

## Overview
This document outlines the backup, verification, and retention policy for the Attendance & Reservation System database (Neon PostgreSQL).

---

## 1. Backup Schedule & Automation
- **Automated Dumps**: Daily logical backups generated via `node scripts/backup-db.js` using `pg_dump`.
- **Neon Cloud Snapshots**: Point-In-Time Restore (PITR) automatically managed by Neon cloud infrastructure.

---

## 2. Recovery Procedures
1. To restore a SQL backup file:
   ```bash
   node scripts/restore-db.js ./backups/backup_YYYY-MM-DD.sql
   ```
2. Re-run Prisma validation and schema push:
   ```bash
   npx prisma validate
   npx prisma db push
   ```

---

## 3. Verification & Integrity Checks
- Periodically test restore scripts against a staging database environment.
- Verify relational data integrity (`Student`, `Session`, `Reservation`, `WaitingList`, `SeatLock`).

# Component & File Responsibilities

This document defines the strict responsibilities of critical files in the system to prevent feature creep and bloating.

## `components/attendance/AttendanceScanner.tsx`
- **Responsibilities:** 
  - Mounts and unmounts the `html5-qrcode` instance.
  - Manages camera permissions and device switching.
  - Plays audio success/error sounds.
  - Triggers vibration for mobile devices.
  - Submits scanned tokens to Server Actions.
- **Should NEVER contain:** 
  - Database logic.
  - Direct authentication checks.
  - Complex UI rendering unrelated to scanning (e.g., displaying student profiles).

## `components/student/StudentCard.tsx`
- **Responsibilities:**
  - Renders the unified visual design of a student's ID card.
  - Handles HTML-to-Image downloading capabilities.
  - Injects dynamic Center Name and Teacher Name.
- **Should NEVER contain:**
  - Data fetching (it should receive data strictly via props).
  - Business rules regarding student states.

## `lib/backup-service.ts`
- **Responsibilities:**
  - Reads the local SQLite database file.
  - Creates timestamped backups.
  - Restores databases from uploaded files securely.
- **Should NEVER contain:**
  - HTTP Request/Response handling (that belongs in API Routes).
  - UI components.

## `actions/attendance/attendance.ts`
- **Responsibilities:**
  - Validates incoming QR tokens and manual attendance submissions.
  - Enforces the business rule: "Only one attendance per student per session."
  - Writes to the `AttendanceRecord` database table.
- **Should NEVER contain:**
  - UI state management.
  - Client-side navigation (`useRouter`).

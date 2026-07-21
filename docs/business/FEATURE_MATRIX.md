# Feature Matrix

This matrix provides a complete inventory of the project's features, their current status, and related dependencies.

| Feature Name | Status | Responsible Files / Domain | Notes |
|---|---|---|---|
| **Admin Authentication** | ✅ Completed | `actions/auth/`, `app/login/`, `middleware` | Custom JWT implementation. |
| **Student Authentication** | ✅ Completed | `actions/auth/student-auth.ts`, `app/student/login/` | Phone number & numeric ID login. |
| **Student CRUD** | ✅ Completed | `actions/students/`, `components/students/` | Includes Egyptian phone strict validation. |
| **Student Archive** | ✅ Completed | `actions/students/`, `app/dashboard/students/archived/` | Soft-delete mechanism. |
| **Sessions Management** | ✅ Completed | `actions/sessions/`, `components/sessions/` | Core entity for attendance tracking. |
| **QR Attendance Scanner** | ✅ Completed | `components/attendance/AttendanceScanner.tsx` | Highly optimized, persistent mounted state. |
| **Manual Attendance** | ✅ Completed | `components/attendance/attendance-list.tsx` | Fallback when QR fails. |
| **Attendance History** | ✅ Completed | `actions/attendance/`, `app/dashboard/attendance/history/` | View and edit past records. |
| **Payment Tracking** | ✅ Completed | `actions/payments/`, `components/payments/` | Handles Generations, Dues, and partial payments. |
| **Student Portal** | ✅ Completed | `app/student/`, `components/student/` | Read-only view for students. |
| **Student Card Generator** | ✅ Completed | `components/student/StudentCard.tsx` | Single source of truth for UI. |
| **Bulk PDF Printing** | ✅ Completed | `lib/pdf/`, `app/print-cards/` | Prints multiple student cards in A4 format. |
| **Excel Import** | ✅ Completed | `components/excel-import/` | Bulk student onboarding. |
| **Settings (Center & Teacher)** | ✅ Completed | `actions/settings/`, `components/settings/` | Dynamically injected into printed cards. |
| **System Backup** | ✅ Completed | `actions/settings/backup.ts`, `app/api/backup/` | SQLite DB download/restore. |
| **Activity Logs** | ✅ Completed | `actions/settings/activity.ts`, `app/dashboard/activity/` | Tracks critical system actions. |

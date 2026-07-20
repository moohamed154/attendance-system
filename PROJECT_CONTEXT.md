# Project Context

## Purpose of the System
This system is an enterprise-grade Attendance and Management Platform for educational centers. It streamlines student management, QR-based and manual attendance tracking, payment collections, and reporting.

## Who Uses It
1. **Admin (Center Manager/Owner)**: Has full access to the system. Can manage all records, settings, and view all reports.
2. **Assistant**: Has limited access to manage daily operations like taking attendance and recording payments, but cannot modify sensitive settings or delete core records.
3. **Student**: Accesses a personalized portal to view their own attendance history, payment status, and download their ID card.

## Workflows

### Admin Workflow
- Manages center settings (Center Name, Teacher Name).
- Creates and manages study sessions.
- Overviews financial reports and attendance insights.
- Generates and prints student cards in bulk.

### Assistant Workflow
- Runs the daily QR scanner or takes manual attendance.
- Records monthly payments and prints receipts.
- Adds new students and edits basic student details.

### Student Workflow
- Logs in using their mobile number and ID.
- Checks their attendance record and payment dues.
- Downloads their QR card for scanning at the center.

### Attendance Workflow
- Can be performed via high-speed QR scanning (using a camera or physical scanner) or manually via the dashboard.
- Only "Active" students can be marked present.
- A student cannot be marked present twice for the same session on the same day.

### QR Workflow
- Each student is assigned a unique, numeric-only ID.
- The system generates a QR code based on this ID.
- The scanner rapidly processes this ID, looks up the student, and records attendance instantly while providing audio/visual feedback.

### Payment Workflow
- Payments are tracked on a monthly or per-session basis.
- The system tracks "Generations" of payments.
- Supports marking payments as Paid, Unpaid, or Partial.

### Printing Workflow
- High-quality student cards are generated via a unified `StudentCard` component.
- Cards can be downloaded as PNG or exported in bulk to PDF for physical printing.

## Business Rules & Philosophy
- **Reliability First**: The system is designed to never drop an attendance scan.
- **Strict Validations**: Data like Egyptian Phone Numbers undergo rigorous regex validation to ensure consistency.
- **Auditability**: Critical actions are logged.
- **Single Source of Truth**: Reusable components (e.g., `StudentCard`) guarantee a consistent look and feel across the portal, PDF exports, and dashboard.

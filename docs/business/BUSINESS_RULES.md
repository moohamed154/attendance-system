# System Business Rules

This document outlines the strict business rules that govern the Attendance System. These rules must be enforced programmatically and must **never** be circumvented by developers or AI.

## Student Management Rules
1. **Egyptian Phone Numbers:** Student phones MUST be exactly 11 digits, start with (010, 011, 012, or 015), and contain no country code or spaces.
2. **Archived Students:** An archived student cannot be marked as present in new sessions and cannot receive new payment subscriptions. They are effectively read-only.
3. **Student ID:** Student IDs are numeric and auto-incrementing. QR codes encode this ID directly.

## Attendance Rules
1. **Single Scan Policy:** A student can only be marked present **once** per active session. Duplicate scans must return an explicit warning/error.
2. **Active Status Required:** Only students with `status === 'ACTIVE'` can be marked present.
3. **Session Binding:** Attendance records are permanently bound to a specific `Session` and a specific `Date`.

## Authentication Rules
1. **Student Login:** The username is the `Student Mobile Number`.
2. **Student Default Password:** The default password is the `Student Numeric ID`.
3. **Admin vs Assistant:** Admins have universal destructive power. Assistants can only perform CRUD operations on daily transactional records (Attendance, Payments).

## Card & Printing Rules
1. **Center Information:** Printed cards MUST always include the dynamic Center Name and Teacher Name fetched from the Settings table.
2. **QR Readability:** The QR code must remain high contrast and strictly sized to ensure rapid scanning by cameras.
3. **Card Dimensions:** The student card uses strict pixel dimensions (`320px * 520px`) across all system interfaces to ensure PDF printing consistency.

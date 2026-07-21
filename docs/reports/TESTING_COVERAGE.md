# Enterprise Playwright E2E Coverage Report

## Overview
This document outlines the coverage provided by the Playwright end-to-end testing suite for the application.

## Modules Covered

### 1. Authentication (`auth.spec.ts`)
- **Admin Login:** Validates that an Admin user can authenticate and access the dashboard.
- **Assistant Login:** Validates that an Assistant user can authenticate and access restricted views.
- **Student Login:** Validates that a Student can log into the portal.
- **Validation Errors:** Ensures incorrect credentials present the correct error UI.
- **Authentication State:** Validates session persistence and layout toggling on logout.

### 2. Dashboard & Layout (`dashboard.spec.ts`)
- **Routing:** Ensures correct redirect to login for unauthenticated users.
- **Navigation:** Verifies sidebar links render appropriately based on the logged-in user's role.
- **Theme/Language:** Validates toggle functionality for UI language and light/dark mode preference persistence.

### 3. Students Management (`students.spec.ts`)
- **List View:** Validates rendering of the student table and correct data display.
- **Creation Flow:** Tests the complete flow of adding a new student through the modal form.
- **Edit/Archive:** Validates updating a student's profile and soft-deleting/archiving a record.
- **Search & Filters:** Verifies table responsiveness to query strings and select filters.

### 4. Sessions Management (`sessions.spec.ts`)
- **List View:** Ensures the timetable renders correctly for Admins.
- **Creation Flow:** Validates adding a session block (day/time/grade).
- **Edit Flow:** Modifying a session schedule.
- **Constraint Checks:** Assistant role is blocked from modifying sessions.

### 5. Attendance Module (`attendance.spec.ts`)
- **QR Mode:** Validates synthetic `qr-scanned` event triggering attendance updates.
- **Manual Mode:** Validates selecting present/absent/late via the UI.
- **Conflict Handling:** Prevents duplicate scans from overwriting statuses.

### 6. Payments Module (`payments.spec.ts`)
- **Monthly Matrix:** Ensures the payment page loads for the correct billing cycle.
- **Payment Record:** Validates marking a student as `PAID` or `PARTIAL`.
- **Dues Generation:** Tests generating dues for a new month.

### 7. Settings Module (`settings.spec.ts`)
- **Form Edits:** Ensures updating Center Name and Teacher Name persists.
- **Preferences:** Validates currency and time format settings propagation.

### 8. Student Portal (`student-portal.spec.ts`)
- **Dashboard:** Validates the student view loads correctly.
- **History:** Ensures past attendance and payment history are rendered accurately.
- **Access Control:** Ensures students cannot access admin/assistant routes.

## Visual Regression Coverage (`visual.spec.ts`)
- **Baseline Capture:** Takes pixel-perfect screenshots of major pages (Dashboard, Students, Attendance) across multiple viewports (Desktop, Mobile).
- **Diff Comparison:** Compares DOM changes ensuring CSS refactors do not break layouts.

## Conclusion
The current suite offers 100% critical path coverage across all 8 core modules, ensuring safe refactoring and continuous deployment confidence.

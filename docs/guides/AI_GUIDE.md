# AI Developer Guide

Welcome to the Attendance System Project! This document is designed to help future AI assistants understand the strict rules and architecture of this codebase.

## Core Directives

1. **Do not break existing functionality.** This is a production application.
2. **Follow the established folder structure.** Components go in `components/[domain]/`, Server Actions go in `actions/[domain]/`.
3. **TypeScript First.** Avoid `any`. Use the centralized interfaces in `types/`.

## Architecture Overview
- **Framework:** Next.js 16 (App Router).
- **Styling:** Tailwind CSS + Shadcn UI.
- **Database:** Prisma ORM.
- **Authentication:** Custom JWT-based auth via Next.js Middleware.
- **Internationalization:** Custom i18n implementation (Arabic default).

## Strict Coding Standards
- **Naming:** 
  - React Components: PascalCase (`StudentCard.tsx`).
  - Actions, Hooks, Utilities: kebab-case (`student-actions.ts`, `use-scanner.ts`).
- **Imports:** Always use `@/` for absolute imports within the project.
- **Validation:** All incoming data must be validated using Zod on the server.

# Protected Systems

The following systems are production-ready.

AI MUST NEVER rewrite, redesign, replace or modify their behavior unless explicitly requested.

Protected Systems:

- Authentication
- Authorization
- Dashboard
- Student CRUD
- Student Portal
- QR Attendance
- Manual Attendance
- Attendance History
- Payments
- Subscriptions
- Reports
- Settings
- Student Cards
- QR Card Generator
- Bulk Printing
- Excel Import
- Activity Logs
- QR Scanner
- Printing Layout
- Center Settings
- Teacher Settings
- Student Login
- Password Change

Future AI must EXTEND these systems.

Never replace them.
Never redesign them.
Never rename them.
Backward compatibility is mandatory.

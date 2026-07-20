# Development Guide

This guide explains how to extend the Attendance System safely and maintainably.

## How to add Server Actions
1. Navigate to the appropriate domain folder inside `actions/` (e.g., `actions/attendance/`).
2. If creating a new file, ensure the first line is `"use server";`.
3. Use centralized Zod validators from `lib/validators/` if validating inputs.
4. Always wrap Prisma calls in `try...catch` blocks and return standardized objects: `{ success: boolean, error?: string, data?: any }`.

## How to create Components
1. **Identify the domain:** Does this component belong to `students/`, `payments/`, or is it globally `shared/`?
2. Create the file inside `components/[domain]/`.
3. Use PascalCase for the filename (e.g., `StudentProfile.tsx`) unless it's a small UI element (e.g., `edit-student-button.tsx`).
4. Avoid heavy data fetching inside the component. Pass data via props or use Server Actions.

## How to modify Prisma Schema
1. Edit `prisma/schema.prisma`.
2. Do **not** rename existing fields. Use `@map` if you must change underlying column names, but avoid it to prevent breaking backward compatibility.
3. Run `npx prisma generate` and `npx prisma db push`.
4. Update the corresponding global types in `types/` to reflect schema changes.

## Naming & Organization Rules
- **Server Actions:** `camelCase` function names.
- **Components:** `PascalCase` function names.
- **Folders:** `kebab-case` or `lowercase`.
- **Validation Rules:** Extract inline regex and zod schemas into `lib/validators/`.
- **Performance Rules:** Use React `memo`, `useMemo`, and `useCallback` sparingly, only when rendering large lists (like the Attendance table).

## How to add new Settings
1. Add the column to the `Settings` table in Prisma.
2. Update `actions/settings/settings.ts` to support saving the new field.
3. Add the UI input to `components/settings/settings-form.tsx`.

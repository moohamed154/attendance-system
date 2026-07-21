# System Code Map

This document explains what belongs in every major directory and what must never be placed there.

## `app/`
**What belongs here:** Next.js Route handlers, Pages (`page.tsx`), Layouts (`layout.tsx`), Error boundaries, and Loading states.
**What must never be here:** Reusable UI components, complex business logic, direct database calls.

## `actions/`
**What belongs here:** Next.js Server Actions (functions marked with `"use server"`).
**What must never be here:** Any client-side React code (e.g., `useState`, `useEffect`), UI components, raw HTML/JSX.

## `components/`
**What belongs here:** React Components (.tsx). Separated into domains:
- `components/attendance/`: Scanner, Lists, Filters.
- `components/students/`: Forms, Buttons, Student UI.
- `components/payments/`: Payment wizards, toggles.
- `components/shared/`: Generic components (Pagination, Search, Export).
- `components/ui/`: Primitive Shadcn components.
**What must never be here:** Database queries (`prisma.x`), Server Actions.

## `lib/`
**What belongs here:** Pure JavaScript/TypeScript utility functions, Prisma singleton, constants, validators, i18n dictionaries.
**What must never be here:** React Components (JSX).

## `types/`
**What belongs here:** Global TypeScript interfaces, type definitions, and enums.
**What must never be here:** Implementation logic or functional code.

## `prisma/`
**What belongs here:** `schema.prisma` and SQLite `.db` files, seed scripts.
**What must never be here:** Application UI or API routes.

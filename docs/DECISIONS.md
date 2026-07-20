# Architectural Decisions Record (ADR)

## Decision 1: Next.js App Router & Server Actions
- **Decision:** Use Next.js App Router heavily relying on Server Actions.
- **Reason:** Simplifies the data mutation flow without needing separate API routes, making the codebase highly cohesive.
- **Pros:** Type safety end-to-end, less boilerplate, immediate revalidation.
- **Cons:** Tightly couples the frontend to the backend logic.

## Decision 2: SQLite via Prisma
- **Decision:** Use local SQLite for database storage.
- **Reason:** The application is intended to run locally or in controlled single-tenant environments without complex DevOps setup.
- **Pros:** Zero-config deployment, easy backups (file copy).
- **Cons:** Cannot scale horizontally across multiple instances (Vercel deployment must handle persistence via external storage if needed).

## Decision 3: Custom JWT Authentication over NextAuth
- **Decision:** Implemented custom JWT auth using `jose` in Middleware.
- **Reason:** NextAuth adds complexity and relies heavily on external OAuth providers. We needed simple, stateless role-based auth.
- **Pros:** Complete control over token payload, simple expiration, no database lookups on every request.
- **Cons:** Must manually handle token rotation and secure cookie flags.

## Decision 4: Single Reusable `StudentCard` Component
- **Decision:** Extracted the Student Card into a single, unified UI component with fixed dimensions (320x520).
- **Reason:** The card design was duplicated across the portal, PDF generation, and dashboard.
- **Pros:** Any design change immediately propagates to all surfaces.
- **Cons:** Must be strictly responsive and self-contained.

## Decision 5: Refactoring by Domain rather than Type
- **Decision:** Components and Actions are grouped by domain (e.g., `components/attendance/`) rather than by type (`components/buttons/`).
- **Reason:** Ensures features are co-located, making it easier to scale and onboard new developers.

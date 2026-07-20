# Architecture Golden Rules & Principles

## Golden Rules
1. **Never Break Existing Behavior**: This is a production application. Feature stability takes absolute precedence over code style.
2. **Single Responsibility**: Every file, folder, and component must have one clearly defined responsibility.
3. **Type Safety**: Avoid `any`. Use strictly defined types located in the centralized `types/` folder.
4. **Backward Compatibility**: Never change database schemas, routes, or API names without explicit, documented rationale.

## Project Principles
- **Maintainability Over Cleverness**: Code should be readable and predictable.
- **AI-Friendly**: The architecture is designed to be easily understandable by AI assistants. Documentation acts as the primary API for future development.

## Folder Responsibilities
- `app/`: Next.js routing and page structures. Do not put reusable components here.
- `components/`: UI components separated strictly by domain (e.g., `attendance/`, `students/`, `shared/`).
- `actions/`: Server Actions, grouped by domain.
- `lib/`: Shared utilities, services, validations, constants.
- `hooks/`: Reusable React logic (`useScanner`, `usePagination`).
- `types/`: Global TypeScript interfaces mapped to Prisma models and API responses.
- `docs/`: Comprehensive project documentation.

## Import Rules
- Always use alias `@/` for internal imports.
- Never use deep relative paths (`../../../../`).
- Group imports logically (React/Next first, third-party libraries second, internal aliases third).

## Error Handling & Logging
- Use centralized error boundaries.
- Validation errors should return standardized `{ error: string }` objects from Server Actions.
- Client-side errors should be toasted using `sonner`.

## Component Rules
- Keep components small. Max 300 lines ideally. If larger, extract child components.
- Do not mix complex data fetching with UI rendering if possible (use Container/Presenter patterns when appropriate).

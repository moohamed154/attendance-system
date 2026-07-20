<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Permanent Mobile Rendering Stability Rules

These rules are mandatory across the entire project (existing pages and all future pages) to prevent history loop crashes on mobile devices:

1. **Router Navigation Rule**: Never call `router.push()`, `router.replace()`, or custom `updateFilters()` methods unless the URL actually needs to change. Always compare the current UI state with the current URL parameters first. If nothing changed, do NOT navigate.
2. **useEffect Rule**: Every `useEffect` that updates the URL must be idempotent. Avoid synchronizing the URL inside a `useEffect` without comparing previous and current values. Running the effect twice must not trigger secondary history updates.
3. **URL Sync Rule**: Do not create feedback cycles where: State Changes -> `useEffect` -> `router.push()` -> `searchParams` updates -> `useEffect` runs again. Stop synchronization if the current URL parameters already match the target filter state.
4. **Mobile Browser Compatibility**: Every page must satisfy WebKit limitations. Desktop Chrome tolerates excessive history updates, but WebKit (Safari/Chrome iOS) does not and will throw a hard crash (`SecurityError`).
5. **Search Filters Standard**: Every filter component must utilize: Local State -> Debounce -> Compare with URL -> Update URL ONLY if values changed.
6. **Stable Callbacks**: Keep update callbacks stable and avoid dependency chains that recreate callbacks after every navigation. Use `useCallback` and `useTransition` correctly.
7. **Preserve Existing Fixes**: Do NOT simplify or rewrite filter components unless the new code guarantees identical comparison guards. Never revert to unconditional `updateFilters()` calls.
8. **New/Existing Pages Review**: Whenever introducing new pages or modifying existing ones (Students, Sessions, Attendance, History, Users, Activity, Reports, Payments, Settings), review every change affecting `useEffect`, `useSearchParams`, `router.push()`, `router.replace()`, and browser history.


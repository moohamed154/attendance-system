# Enterprise Testing Rules

## 1. No Code Modifications for Tests
- NEVER modify business logic, authentication logic, database schema, API contracts, routing, UI behavior, styling, responsiveness, or features to pass tests.
- Only improve testability by injecting `data-testid` and hardening playwright assertions.

## 2. Test ID Standard
- Every interactive element (buttons, forms, inputs) and structural container (pages, layouts, tables) MUST have a stable `data-testid`.
- Never use `text=`, `.class-name`, or layout-based locators like `nth-child`.

## 3. Localization
- Do NOT depend on translated text. Test assertions should rely on structural state, such as URL matches, component visibility, or matching `data-testid`.

## 4. Waiting Strategies
- NEVER use `page.waitForTimeout()`.
- Use deterministic assertions: `await expect(locator).toBeVisible()` or wait for URL transitions via `page.waitForURL()`.

## 5. Diagnostic Collection
- Tests must be run with traces, screenshots, and videos enabled on failure (or on first retry).
- Console and network errors must be captured during E2E runs to debug flaky scenarios.

## 6. Zero Test Debt
- A feature is not considered complete unless it has Playwright coverage. No future PRs may be merged without Playwright tests.

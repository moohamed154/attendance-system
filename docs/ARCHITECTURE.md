# Application Architecture

## Testing Standards
The project strictly enforces Enterprise E2E testing standards via Playwright.

- **Page Object Model**: All interaction logic is encapsulated in `tests/pages/`. Spec files should never contain raw DOM selectors.
- **Playwright Strategy**: We execute a 5-browser matrix on every pull request.
- **data-testid Naming Convention**: Kebab-case naming explicitly describing the component (e.g., `attendance-scanner`, `login-form`).
- **Waiting Strategy**: Arbitrary `waitForTimeout()` is strictly banned. Rely on deterministic assertions (`expect(locator).toBeVisible()`).
- **Browser Support**: Chromium, Firefox, WebKit, Mobile Chrome, and Mobile Safari.
- **Selector Priority**:
  1. `getByTestId()`
  2. `getByRole()`
  3. `getByLabel()`
  4. `getByPlaceholder()`
  5. `getByText()`

## Diagnostic Strategy
- The testing infrastructure automatically collects full traces, screenshots, and videos on test failures to provide immediate context for debugging without re-running.
- `playwright.config.ts` enforces `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, and `video: 'retain-on-failure'`.

# Enterprise Testing Guidelines

## How to write Playwright tests
1. Use the pre-configured fixtures from `tests/fixtures/app.ts`.
2. Do not instantiate Page Objects manually inside the tests.
3. Every test should be deterministic and isolated.

## Naming convention
Follow strict kebab-case for data-testids (e.g. `attendance-mode-qr`).

## Folder structure
- `tests/pages/`: Contains Page Object Models.
- `tests/helpers/`: Contains utility scripts (DB seeders, auth bypass).
- `tests/fixtures/`: Custom Playwright test runner overrides.

## Mocking strategy
Mock hardware interactions like the QR scanner via `page.evaluate()` injecting synthetic DOM events (`qr-scanned`), bypassing physical constraints.

## Visual regression strategy
The `tests/visual.spec.ts` handles visual baseline comparisons. Use `toHaveScreenshot` and ensure dynamic components (like live clocks or pulsating borders) are hidden before capture using CSS.

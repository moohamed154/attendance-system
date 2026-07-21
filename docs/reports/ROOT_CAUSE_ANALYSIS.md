# Playwright End-to-End Testing - Root Cause Analysis

## Executive Summary
After rigorous analysis of the Playwright execution results, traces, and screenshots, it is evident that the **application itself is not broken**. 

Instead, the execution environment for Playwright is misconfigured. Every single UI failure (timeouts, missing elements, failed navigations) points to exactly one catastrophic infrastructure root cause: **Complete Loss of React Hydration and CSS Styling due to Missing Static Assets.**

## Detailed Evidence

### 1. Visual Evidence (Screenshots)
Inspection of the Playwright failure screenshots (e.g., `test-results/auth-Authentication-Flows--21909-persists-across-navigations-chromium/test-failed-1.png`) reveals that the application is rendering as **plain, unstyled HTML**. 
- Tailwind CSS is not applied.
- Shadcn UI components are rendered as raw unstyled elements.
- Layouts are broken.

### 2. Hydration Evidence (Javascript Failure)
Because the application is rendered as plain HTML without styling, it confirms that the browser is receiving `404 Not Found` for all CSS files.
More critically, it means it is also receiving `404 Not Found` for all JavaScript bundles (`_next/static/chunks/...`).
Without JavaScript:
- **Shadcn UI Dialogs** cannot open (e.g., *Can open Add Student dialog* fails).
- **Client-side Form State** (`useActionState`) falls back to native POST requests.
- **Toasts** (Sonner) cannot render (e.g., *Invalid credentials show error message* fails because `toast.error` requires JS).
- **Interactive Selects** and dropdowns are dead.

### 3. File System Evidence
The Playwright `webServer` command is currently configured to run the Next.js standalone server:
```
command: 'node .next/standalone/server.js'
```
Next.js explicitly states in its documentation that the `standalone` build **does not include** the `public` or `.next/static` folders. They are expected to be served by a CDN or Nginx in production.
Inspection of the `.next/standalone/.next` directory on the test environment confirms that the `static/` folder is completely missing.

## Categorized Failures

### Category 1: Interactive Component Failures (Requires JS)
- **Affected Tests:** "Can open Add Student dialog", "Settings page loads", "Invalid credentials show error message"
- **Symptom:** `Error: expect(locator).toBeVisible() failed`
- **Root Cause:** Radix UI primitives (Dialogs, Selects, Toasts) require React Hydration to bind event listeners and manage state. Without JS, clicks do nothing and elements do not appear in the DOM.

### Category 2: Navigation & Assertion Timeouts
- **Affected Tests:** "Mock QR Result", "Admin can login successfully", "Logout redirects to login"
- **Symptom:** `Test timeout of 10000ms exceeded` OR `toHaveURL failed`.
- **Root Cause:** Playwright expects client-side routing (`next/navigation`) to handle transitions. Native HTML form submissions trigger full page reloads, which can desync Playwright's navigation watchers, or the test times out waiting for a specific styled element to appear that never does.

### Category 3: Visual Regression Baselines
- **Affected Tests:** 35 tests across Firefox, WebKit, Mobile Chrome, and Mobile Safari.
- **Symptom:** `A snapshot doesn't exist at ..., writing actual.`
- **Root Cause:** This is **not a bug**. Playwright intentionally fails the very first time a visual regression test is run on a new browser engine to establish the baseline image. 

---

## Recommended Fix

**Estimated Complexity:** Low (Infrastructure Only)

To fix this, we must ensure the Next.js `standalone` server has access to the static files during Playwright tests. We can do this by updating the Playwright `webServer` command to copy the required static assets before launching the server.

**Proposed webServer command:**
*(For Windows)*
```json
command: "xcopy /E /I /Y .next\\static .next\\standalone\\.next\\static && xcopy /E /I /Y public .next\\standalone\\public && node .next/standalone/server.js"
```
Or simply use `npm run start` if we temporarily disable `output: 'standalone'` during E2E test runs, or use `next dev` (though testing production build is preferred).

Since we want to test the true production standalone build, copying the static assets into the standalone directory is the most robust and accurate solution.

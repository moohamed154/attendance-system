import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const ADMIN_AUTH_FILE = path.join(__dirname, '.auth/admin.json');

export default defineConfig({
  timeout: 30000,
  testDir: './tests',
  fullyParallel: false,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: 2,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  expect: {
    timeout: 15000,
  },
  globalSetup: require.resolve('./tests/global-setup'),
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },
  projects: [
    // ── Auth setup — runs first, creates .auth/admin.json ────────────
    {
      name: 'auth-setup',
      testMatch: '**/fixtures/auth-setup.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Desktop browsers — depend on auth-setup ──────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: ADMIN_AUTH_FILE },
      dependencies: ['auth-setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: ADMIN_AUTH_FILE },
      dependencies: ['auth-setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: ADMIN_AUTH_FILE },
      dependencies: ['auth-setup'],
    },

    // ── Mobile browsers — depend on auth-setup ───────────────────────
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'], storageState: ADMIN_AUTH_FILE },
      dependencies: ['auth-setup'],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'], storageState: ADMIN_AUTH_FILE },
      dependencies: ['auth-setup'],
    },
  ],
  webServer: {
    command: 'node scripts/prepare-standalone.js && node .next/standalone/server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      JWT_SECRET: process.env.JWT_SECRET || 'e2e-test-super-secret-key-12345',
      STUDENT_JWT_SECRET: process.env.STUDENT_JWT_SECRET || 'student-test-super-secret-key-12345',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_POyT4Fn3RKrt@ep-weathered-pine-aslto6hf.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require',
      PLAYWRIGHT_TEST: '1',
    }
  },
});

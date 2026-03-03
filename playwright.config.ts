import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Playwright E2E configuration.
 * Tests live in tests/e2e/
 * Run: npm run test:e2e        (needs `npm run dev` running, or webServer auto-starts it)
 * Run: npm run test:e2e:ui     (Playwright UI mode)
 *
 * NOTE: .alsa-stub/ contains a real libasound.so.2 extracted from the Ubuntu package
 * so Chromium headless can load without ALSA being system-installed.
 */

// Ensure Chromium headless can find libasound.so.2 (not system-installed in this env)
const alsaStub = path.join(__dirname, '.alsa-stub')
const existing = process.env.LD_LIBRARY_PATH ?? ''
process.env.LD_LIBRARY_PATH = existing ? `${alsaStub}:${existing}` : alsaStub

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})


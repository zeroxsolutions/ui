import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const baseURL = process.env['BASE_URL'] || 'http://localhost:8790';

const preset = nxE2EPreset(import.meta.dirname, { testDir: './src' });

export default defineConfig({
  ...preset,
  reporter: [...(Array.isArray(preset.reporter) ? preset.reporter : []), ['./src/test/interrupt-on-sigterm.ts']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm exec nx run @zeroxsolutions/native-preview:serve-static',
    // The export sits under `/native-preview/`, its base URL on the docs site; `/` answers 404.
    url: 'http://localhost:8790/native-preview/',
    // A server left on 8790 by an earlier run serves an older export than the one just made, and the suite
    // passes against it. A held port fails the run instead.
    reuseExistingServer: false,
    cwd: workspaceRoot,
    // Starting includes the export when its cache misses; the 60s default is timed for a server that only boots.
    timeout: 300_000,
    // Unset, Playwright SIGKILLs nx and the server nx started keeps port 8790, so the next run is refused.
    gracefulShutdown: { signal: 'SIGINT', timeout: 10_000 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});

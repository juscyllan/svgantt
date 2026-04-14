import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 15_000,
  use: {
    baseURL: 'http://localhost:9998',
    viewport: { width: 1200, height: 800 },
    screenshot: 'on',
  },
  webServer: {
    command: 'bun demo/server.ts',
    port: 9998,
    reuseExistingServer: true,
  },
})

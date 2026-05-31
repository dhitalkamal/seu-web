import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost",
    viewportWidth: 1440,
    viewportHeight: 900,
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    retries: { runMode: 1, openMode: 0 },
    experimentalRunAllSpecs: true,
  },
});

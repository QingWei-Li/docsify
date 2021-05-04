import { TEST_HOST } from './test/config/server.js';

const sharedConfig = {
  errorOnDeprecated: true,
  globals: {
    TEST_HOST,
  },
  globalSetup: './test/config/jest.setup.cjs',
  globalTeardown: './test/config/jest.teardown.cjs',
  resetModules: true,
  restoreMocks: true,
};

// Jest configuration: https://jestjs.io/docs/en/configuration

// Jest is configured for us to write our code as native ES Modules. See
// https://github.com/facebook/jest/issues/9430 and
// https://jestjs.io/docs/en/ecmascript-modules.

export default {
  // Disable transforms, we'll write plain JS. This is needed for native
  // ESM
  transform: {},

  // Adding globals to config root for easier importing into .eslint.cjs, but
  // as of Jest 26.4.2 these globals need to be added to each project config
  // as well.
  globals: sharedConfig.globals,
  projects: [
    // Unit Tests (Jest)
    {
      ...sharedConfig,
      displayName: 'unit',
      setupFilesAfterEnv: ['<rootDir>/test/config/jest.setup-tests.js'],
      testMatch: [
        '<rootDir>/test/unit/**/*.test.js',
        '<rootDir>/packages/docsify-server-renderer/src/**/*.test.js',
      ],
      testURL: `${TEST_HOST}/_blank.html`,
    },
    // Integration Tests (Jest)
    {
      ...sharedConfig,
      displayName: 'integration',
      setupFilesAfterEnv: ['<rootDir>/test/config/jest.setup-tests.js'],
      testMatch: ['<rootDir>/test/integration/*.test.js'],
      testURL: `${TEST_HOST}/_blank.html`,
    },
    // E2E Tests (Jest + Playwright)
    {
      ...sharedConfig,
      displayName: 'e2e',
      preset: 'jest-playwright-preset',
      setupFilesAfterEnv: [
        '<rootDir>/test/config/jest-playwright.setup-tests.js',
      ],
      testEnvironmentOptions: {
        'jest-playwright': {
          // prettier-ignore
          browsers: [
            'chromium',
            'firefox',
            'webkit',
          ],
          launchOptions: {
            // headless: false,
            // devtools: true,
          },
        },
      },
      testMatch: ['<rootDir>/test/e2e/*.test.js'],
    },
  ],
};

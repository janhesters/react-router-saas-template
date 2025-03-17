import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const rootConfig = defineConfig({
  plugins: [
    tailwindcss(),
    !process.env.VITEST && reactRouter(),
    tsconfigPaths(),
  ],
});

const testConfig = defineConfig({
  test: {
    workspace: [
      {
        ...rootConfig,
        test: { include: ['app/**/*.test.ts'], name: 'unit-tests' },
      },
      {
        ...rootConfig,
        test: {
          include: ['app/**/*.spec.ts'],
          name: 'integration-tests',
          setupFiles: ['app/test/setup-server-test-environment.ts'],
        },
      },
      {
        ...rootConfig,
        test: {
          environment: 'happy-dom',
          include: ['app/**/*.test.tsx'],
          name: 'react-happy-dom-tests',
          setupFiles: ['app/test/setup-browser-test-environment.ts'],
        },
      },
    ],
  },
});

export default defineConfig({ ...rootConfig, ...testConfig });

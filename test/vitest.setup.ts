import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { telldusApiHandlers } from '../src/api/__tests__/TelldusApiHandlers';

const server = setupServer(...telldusApiHandlers);

// Start server before all tests
beforeAll(() =>
  server.listen({
    onUnhandledRequest: 'error',
  }),
);

// Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test for test isolation
afterEach(() => server.resetHandlers());

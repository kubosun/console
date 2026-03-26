import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// React 19 can throw "window is not defined" after jsdom teardown.
// This is a known issue with React 19 + jsdom. Suppress it.
afterEach(() => {
  cleanup();
});

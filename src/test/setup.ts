// Global test setup
import '@/test/mocks/nativescript-core.mock';

// Add any global test setup here
beforeAll(() => {
  // Setup code that runs once before all tests
});

beforeEach(() => {
  // Setup code that runs before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup code that runs after each test
});

afterAll(() => {
  // Cleanup code that runs once after all tests
});

// Global test utilities
global.flushPromises = () => new Promise(resolve => setImmediate(resolve));

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

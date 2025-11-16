import { vi, beforeAll, afterAll } from "vitest";

/**
 * Waits for a specified amount of time
 * Useful for testing async operations
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Flushes all pending promises
 * Useful for testing async operations
 */
export const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

/**
 * Creates a mock function with typed return value
 */
export const createMockFn = <T extends (...args: never[]) => unknown>(implementation?: T) => {
  return vi.fn(implementation) as T;
};

/**
 * Suppresses console errors during test execution
 * Useful when testing error scenarios
 */
export const suppressConsoleError = () => {
  // eslint-disable-next-line no-console
  const originalError = console.error;
  beforeAll(() => {
    // eslint-disable-next-line no-console
    console.error = vi.fn();
  });
  afterAll(() => {
    // eslint-disable-next-line no-console
    console.error = originalError;
  });
};

/**
 * Creates a mock file for file upload testing
 */
export const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([""], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

/**
 * Simulates user typing with delay
 */
export const typeWithDelay = async (element: HTMLElement, text: string, delay = 50) => {
  for (const char of text) {
    element.focus();
    (element as HTMLInputElement).value += char;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(delay);
  }
};

/**
 * Mock localStorage for testing
 */
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      store[key] = undefined as never;
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => {
        store[key] = undefined as never;
      });
    }),
    get length() {
      return Object.keys(store).filter((key) => store[key] !== undefined).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store).filter((key) => store[key] !== undefined);
      return keys[index] || null;
    }),
  };
};

/**
 * Mock sessionStorage for testing
 */
export const mockSessionStorage = mockLocalStorage;

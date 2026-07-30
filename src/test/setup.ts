import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "@/mocks/server";

/**
 * jsdom ships no ResizeObserver, and Radix measures with it whenever a floating layer opens. Without
 * this, a test that opens a tooltip or a popover throws asynchronously: the assertions still pass but
 * vitest reports an unhandled error and warns the result may be a false positive.
 */
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

beforeAll(() => {
  server.listen({
    onUnhandledRequest: "error",
  });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

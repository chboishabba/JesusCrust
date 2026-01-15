import assert from 'node:assert';
import { startGuardedBrowserHost } from './host.js';

function createFakeWindow() {
  const store = new Map();
  return {
    localStorage: {
      getItem(key) {
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key, value) {
        store.set(key, value);
      },
      removeItem(key) {
        store.delete(key);
      },
    },
    location: { origin: 'http://example.com' },
    performance: { now: () => Date.now() },
    requestAnimationFrame() {
      return 1;
    },
    cancelAnimationFrame() {},
    setTimeout() {
      return 0;
    },
    clearTimeout() {},
  };
}

const fakeWindow = createFakeWindow();
startGuardedBrowserHost({ window: fakeWindow });
const surface = fakeWindow.__versoGuardedHost;
assert(surface, 'Guarded host surface should exist');
assert(surface.running(), 'host should be running after start');

surface.requestFallback('e2e-test');
assert(!surface.running(), 'fallback should stop the host');
const telemetry = surface.getTelemetry();
assert.strictEqual(telemetry.fallbacks.length, 1, 'fallback event recorded');
assert.strictEqual(telemetry.fallbacks[0].reason, 'e2e-test');
assert.strictEqual(fakeWindow.localStorage.getItem('verso.browser.host:fallback') !== null, true);

surface.reset();
assert(surface.running(), 'reset should re-enable the host');
assert.strictEqual(fakeWindow.localStorage.getItem('verso.browser.host:fallback'), null);

console.log('Guarded browser host flow test passed');

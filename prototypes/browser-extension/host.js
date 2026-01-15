import { createDropInHost } from '../dropin/adapter.js?browser=1';
import { createTelemetry } from './telemetry.js';

const FALLBACK_STORAGE_KEY = 'verso.browser.host:fallback';
const FRAME_TIMEOUT_MS = 16;

function getGlobalWindow(windowOverride) {
  if (windowOverride) {
    return windowOverride;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  return {}; // best effort for non-browser environments
}

function readFallbackRecord(win) {
  try {
    const stored = win?.localStorage?.getItem(FALLBACK_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Unable to read fallback record', error);
    return null;
  }
}

function writeFallbackRecord(win, record) {
  try {
    if (record === null) {
      win?.localStorage?.removeItem?.(FALLBACK_STORAGE_KEY);
      return;
    }
    win?.localStorage?.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(record));
  } catch (error) {
    console.warn('Unable to persist fallback record', error);
  }
}

class GuardedBrowserHost {
  constructor(options = {}) {
    this.window = getGlobalWindow(options.window);
    this.adapter = options.adapter ?? createDropInHost();
    this.telemetry = options.telemetry ?? createTelemetry({ logger: console });
    this.fallbackReason = null;
    this.tickToken = null;
    this.frameHandle = null;
    this.isRunning = false;
    this.originRecord = readFallbackRecord(this.window);
    this.origin = this.window?.location?.origin ?? 'unknown-origin';
    this.disabled = Boolean(this.originRecord);
  }

  start() {
    if (this.disabled) {
      this.telemetry.recordFallback(this.originRecord.reason ?? 'preflight-disabled', { origin: this.origin });
      return;
    }
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.scheduleFrame();
    this.exposeControlSurface();
  }

  exposeControlSurface() {
    const surface = {
      getDiagnostics: () => this.adapter.getDiagnostics(),
      getLastBatch: () => this.adapter.getLastBatch(),
      getTelemetry: () => this.telemetry.getSnapshot(),
      requestFallback: (reason) => this.handleFallback(reason ?? 'external-request'),
      reset: () => this.reset(),
      origin: this.origin,
      running: () => this.isRunning && !this.disabled,
    };
    try {
      this.window.__versoGuardedHost = surface;
    } catch (error) {
      console.warn('Unable to expose guarding surface globally', error);
    }
  }

  reset() {
    this.cancelFrame();
    this.tickToken = null;
    this.disabled = false;
    this.originRecord = null;
    writeFallbackRecord(this.window, null);
    this.isRunning = false;
    this.start();
  }

  scheduleFrame() {
    if (this.frameHandle || this.disableLoop()) {
      return;
    }
    const callback = () => {
      this.frameHandle = null;
      if (this.disableLoop()) {
        return;
      }
      this.commitTick();
      this.beginTick();
      this.scheduleFrame();
    };
    if (typeof this.window?.requestAnimationFrame === 'function') {
      this.frameHandle = this.window.requestAnimationFrame(callback);
    } else {
      this.frameHandle = this.window?.setTimeout?.(callback, FRAME_TIMEOUT_MS);
    }
  }

  cancelFrame() {
    if (!this.frameHandle) {
      return;
    }
    if (typeof this.window?.cancelAnimationFrame === 'function') {
      this.window.cancelAnimationFrame(this.frameHandle);
    } else {
      this.window?.clearTimeout?.(this.frameHandle);
    }
    this.frameHandle = null;
  }

  disableLoop() {
    return this.disabled;
  }

  beginTick() {
    if (this.disabled) {
      return;
    }
    try {
      this.tickToken = this.adapter.beginTick();
      this.telemetry.recordTickStart(this.tickToken.tickId);
    } catch (error) {
      this.handleFallback(`beginTick failed: ${error.message}`);
    }
  }

  commitTick() {
    if (!this.tickToken) {
      return;
    }
    const start = this.window?.performance?.now?.() ?? Date.now();
    try {
      const result = this.adapter.commit(this.tickToken);
      const duration = (this.window?.performance?.now?.() ?? Date.now()) - start;
      const payloadSize = typeof result.serialized === 'string'
        ? result.serialized.length
        : Array.isArray(result.serialized)
          ? result.serialized.length
          : 0;
      const work = {
        dom_mutations: Array.isArray(result.serialized)
          ? result.serialized.length
          : 0,
        nodes_touched: 0,
        selectors_evaluated: 0,
        elements_invalidated: 0,
        patch_bytes: payloadSize,
      };
      const durations = {
        script_ms: duration,
        style_ms: 0,
        layout_ms: 0,
        render_ms: 0,
        total_ms: duration,
      };
      this.telemetry.recordCommit({
        tickId: this.tickToken.tickId,
        duration,
        patchSize: payloadSize,
        fingerprint: result.fingerprint,
        durations,
        work,
      });
    } catch (error) {
      this.handleFallback(`commit failed: ${error.message}`);
    } finally {
      this.tickToken = null;
    }
  }

  handleFallback(reason) {
    if (this.disabled) {
      return;
    }
    this.disabled = true;
    this.fallbackReason = reason;
    this.cancelFrame();
    writeFallbackRecord(this.window, { origin: this.origin, reason, timestamp: Date.now() });
    this.telemetry.recordFallback(reason, { origin: this.origin, tick: this.tickToken?.tickId ?? null });
    console.warn('Verso guardrail fallback triggered:', reason);
  }
}

export function createGuardedBrowserHost(options) {
  return new GuardedBrowserHost(options);
}

export function startGuardedBrowserHost(options) {
  const host = createGuardedBrowserHost(options);
  host.start();
  return host;
}

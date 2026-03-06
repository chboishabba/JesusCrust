import { createDropInHost } from './dropin/adapter.js';
import { createTelemetry } from './telemetry.js';

const FALLBACK_STORAGE_KEY = 'verso.browser.host:fallback';
const FRAME_TIMEOUT_MS = 16;

function coerceNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function coerceCount(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  return fallback;
}

function normalizeDurations(input, measuredDuration) {
  const data = input ?? {};
  const styleRecalcMs = coerceNumber(
    data.style_recalc_ms ?? data.style_ms ?? data.style_time_ms,
    0
  );
  const selectorInvalidationMs = coerceNumber(
    data.selector_invalidation_ms ?? data.selector_match_ms,
    0
  );
  const layoutMs = coerceNumber(data.layout_ms ?? data.layout_time_ms, 0);
  const renderMs = coerceNumber(data.render_ms ?? data.render_time_ms, 0);
  const totalMs = coerceNumber(data.total_ms, measuredDuration);
  const scriptProvided = typeof data.script_ms === 'number'
    ? data.script_ms
    : typeof data.js_time_ms === 'number'
      ? data.js_time_ms
      : null;
  const scriptMs = scriptProvided ?? Math.max(0, totalMs - (styleRecalcMs + layoutMs + renderMs));
  return {
    script_ms: coerceNumber(scriptMs, totalMs),
    style_ms: styleRecalcMs,
    style_recalc_ms: styleRecalcMs,
    selector_invalidation_ms: selectorInvalidationMs,
    layout_ms: layoutMs,
    render_ms: renderMs,
    total_ms: totalMs,
  };
}

function normalizeWork(input, payloadSize, patchOpsHint) {
  const data = input ?? {};
  const domMutations = coerceCount(data.dom_mutations ?? data.patch_ops, 0);
  const patchOps = coerceCount(data.patch_ops ?? domMutations ?? patchOpsHint, patchOpsHint ?? 0);
  return {
    dom_mutations: domMutations || patchOps,
    nodes_touched: coerceCount(data.nodes_touched, 0),
    selectors_evaluated: coerceCount(data.selectors_evaluated, 0),
    elements_invalidated: coerceCount(data.elements_invalidated ?? data.invalidated_elements, 0),
    restyled_elements: coerceCount(data.restyled_elements ?? data.elements_restyled, 0),
    patch_bytes: coerceCount(data.patch_bytes, payloadSize),
    patch_ops: patchOps || domMutations,
  };
}

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
      const measuredDuration = (this.window?.performance?.now?.() ?? Date.now()) - start;
      const payloadSize = typeof result.serialized === 'string'
        ? result.serialized.length
        : Array.isArray(result.serialized)
          ? result.serialized.length
          : 0;
      const telemetry = result?.telemetry ?? result?.metrics ?? {};
      const durations = normalizeDurations(telemetry.durations ?? telemetry, measuredDuration);
      const work = normalizeWork(telemetry.work ?? telemetry, payloadSize, result?.patchOps);
      const duration = durations.total_ms ?? measuredDuration;
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

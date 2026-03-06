import { startGuardedBrowserHost } from './host.js';

try {
  startGuardedBrowserHost();
} catch (error) {
  console.error('Failed to start injected Guarded Browser Host', error);
}

const CHANNEL = 'verso-guarded-host';

const toJSONSafe = (value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(toJSONSafe);
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    return entries.reduce((acc, [key, entry]) => {
      acc[key] = toJSONSafe(entry);
      return acc;
    }, {});
  }
  return value;
};

const snapshotFromSurface = (surface) => ({
  origin: surface.origin,
  running: surface.running(),
  telemetry: toJSONSafe(surface.getTelemetry()),
  diagnostics: toJSONSafe(surface.getDiagnostics()),
  lastBatch: toJSONSafe(surface.getLastBatch()),
});

const handleMessage = (event) => {
  if (event.source !== window) {
    return;
  }
  const message = event.data;
  if (!message || message.channel !== CHANNEL || message.target !== 'page') {
    return;
  }

  const surface = window.__versoGuardedHost;
  let response = { ok: true, payload: null };
  try {
    if (!surface) {
      response = { ok: false, error: 'guarded host unavailable' };
    } else if (message.type === 'getSnapshot') {
      response.payload = snapshotFromSurface(surface);
    } else if (message.type === 'requestFallback') {
      const reason = message.payload?.reason ?? 'manual override';
      surface.requestFallback(reason);
      response.payload = snapshotFromSurface(surface);
    } else if (message.type === 'reset') {
      surface.reset();
      response.payload = snapshotFromSurface(surface);
    } else {
      response = { ok: false, error: `unknown request type: ${message.type}` };
    }
  } catch (error) {
    response = { ok: false, error: error?.message ?? String(error) };
  }

  window.postMessage(
    {
      channel: CHANNEL,
      target: 'content',
      requestId: message.requestId,
      ...response,
    },
    '*'
  );
};

window.addEventListener('message', handleMessage);

const DEFAULT_LOGGER = console;

function createMetricStore() {
  return {
    commits: [],
    fallbacks: [],
    ticks: [],
  };
}

export function createTelemetry(options = {}) {
  const logger = options.logger ?? DEFAULT_LOGGER;
  const metrics = createMetricStore();

  function log(kind, label, data = {}) {
    if (logger && typeof logger.debug === 'function') {
      logger.debug(`[verso-telemetry] ${kind}`, label, data);
    }
  }

  function recordTickStart(tickId) {
    const entry = { tickId, timestamp: Date.now() };
    metrics.ticks.push(entry);
    log('tick', 'start', entry);
  }

function recordCommit({
  tickId,
  duration,
  patchSize,
  fingerprint,
  durations = {},
  work = {},
  guardrail = null,
}) {
  const entry = {
    tickId,
    duration,
    patchSize,
    fingerprint: fingerprint ?? null,
    durations: {
      script_ms: durations.script_ms ?? duration,
      style_ms: durations.style_ms ?? 0,
      layout_ms: durations.layout_ms ?? 0,
      render_ms: durations.render_ms ?? 0,
      total_ms: durations.total_ms ?? duration,
    },
    work: {
      dom_mutations: work.dom_mutations ?? 0,
      nodes_touched: work.nodes_touched ?? 0,
      selectors_evaluated: work.selectors_evaluated ?? 0,
      elements_invalidated: work.elements_invalidated ?? 0,
      patch_bytes: work.patch_bytes ?? patchSize,
    },
    guardrail,
    timestamp: Date.now(),
  };
  metrics.commits.push(entry);
  log('commit', 'ok', entry);
}

  function recordFallback(reason, extra = {}) {
    const entry = {
      reason,
      timestamp: Date.now(),
      ...extra,
    };
    metrics.fallbacks.push(entry);
    if (logger && typeof logger.warn === 'function') {
      logger.warn('[verso-telemetry] fallback', entry);
    }
  }

  function dump() {
    if (logger && typeof logger.info === 'function') {
      logger.info('[verso-telemetry] snapshot', getSnapshot());
    }
  }

  function getSnapshot() {
    return {
      commits: [...metrics.commits],
      fallbacks: [...metrics.fallbacks],
      ticks: [...metrics.ticks],
    };
  }

  return {
    recordTickStart,
    recordCommit,
    recordFallback,
    dump,
    getSnapshot,
  };
}

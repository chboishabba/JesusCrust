const CHANNEL = 'verso-guarded-host';
const originLabel = document.getElementById('origin-label');
const runningPill = document.getElementById('running-pill');
const fallbackReasonLabel = document.getElementById('fallback-reason');
const lastCommitLabel = document.getElementById('last-commit');
const lastBatchLabel = document.getElementById('last-batch');
const tickCountLabel = document.getElementById('tick-count');
const commitCountLabel = document.getElementById('commit-count');
const fallbackCountLabel = document.getElementById('fallback-count');
const commitDurationLabel = document.getElementById('commit-duration');
const commitPatchSizeLabel = document.getElementById('commit-patch-size');
const commitFingerprintLabel = document.getElementById('commit-fingerprint');
const diagnosticsLabel = document.getElementById('diagnostics');
const fallbackButton = document.getElementById('fallback-button');
const fallbackReasonInput = document.getElementById('fallback-reason-input');
const resetButton = document.getElementById('reset-button');
const exportButton = document.getElementById('export-button');
const openWindowButton = document.getElementById('open-window');

const workScriptBar = document.getElementById('work-script-bar');
const workStyleBar = document.getElementById('work-style-bar');
const workLayoutBar = document.getElementById('work-layout-bar');
const workRenderBar = document.getElementById('work-render-bar');
const workTotalBar = document.getElementById('work-total-bar');
const workScriptValue = document.getElementById('work-script');
const workStyleValue = document.getElementById('work-style');
const workLayoutValue = document.getElementById('work-layout');
const workRenderValue = document.getElementById('work-render');
const workTotalValue = document.getElementById('work-total');

const selectorCount = document.getElementById('selector-count');
const selectorElements = document.getElementById('selector-elements');
const selectorNodes = document.getElementById('selector-nodes');
const selectorInvalidationMs = document.getElementById('selector-invalidation-ms');
const selectorRestyled = document.getElementById('selector-restyled');

const ratioInvalidationShare = document.getElementById('ratio-invalidation-share');
const ratioInvalidationsPerOp = document.getElementById('ratio-invalidations-per-op');
const ratioSelectorsPerInvalidation = document.getElementById('ratio-selectors-per-invalidation');

const guardrailRateLabel = document.getElementById('guardrail-rate');
const guardrailCountLabel = document.getElementById('guardrail-count');
const guardrailReasonLabel = document.getElementById('guardrail-reason');

const fingerprintValue = document.getElementById('fingerprint-value');
const fingerprintStability = document.getElementById('fingerprint-stability');

const rollingTotalAvg = document.getElementById('rolling-total-avg');
const rollingTotalP95 = document.getElementById('rolling-total-p95');
const rollingSelectorAvg = document.getElementById('rolling-selector-avg');
const rollingStyleAvg = document.getElementById('rolling-style-avg');
const rollingLayoutAvg = document.getElementById('rolling-layout-avg');
const rollingRenderAvg = document.getElementById('rolling-render-avg');

function renderUnavailable(message) {
  originLabel.textContent = `Origin: ${message}`;
  runningPill.textContent = 'Stopped';
  runningPill.classList.remove('running', 'stopped');
  runningPill.classList.add('stopped');
  tickCountLabel.textContent = 'Ticks: 0';
  commitCountLabel.textContent = 'Commits: 0';
  fallbackCountLabel.textContent = 'Fallbacks: 0';
  commitDurationLabel.textContent = 'Duration: —';
  commitPatchSizeLabel.textContent = 'Patch size: —';
  commitFingerprintLabel.textContent = 'Fingerprint: —';
  lastCommitLabel.textContent = 'Last commit: not available';
  lastBatchLabel.textContent = 'Last batch: not available';
  fallbackReasonLabel.textContent = 'Fallback status: none';
  diagnosticsLabel.textContent = 'Waiting for diagnostics...';
  selectorCount.textContent = '0';
  selectorElements.textContent = '0';
  selectorNodes.textContent = '0';
  selectorInvalidationMs.textContent = '0ms';
  selectorRestyled.textContent = '0';
  ratioInvalidationShare.textContent = '0%';
  ratioInvalidationsPerOp.textContent = '0';
  ratioSelectorsPerInvalidation.textContent = '0';
  guardrailRateLabel.textContent = '0 per 1k ticks';
  guardrailCountLabel.textContent = '0';
  guardrailReasonLabel.textContent = 'none';
  fingerprintValue.textContent = '—';
  fingerprintStability.textContent = 'unknown';
  rollingTotalAvg.textContent = '0ms';
  rollingTotalP95.textContent = '0ms';
  rollingSelectorAvg.textContent = '0ms';
  rollingStyleAvg.textContent = '0ms';
  rollingLayoutAvg.textContent = '0ms';
  rollingRenderAvg.textContent = '0ms';
}

function updateSurface(snapshot) {
  if (!snapshot) {
    renderUnavailable('awaiting host...');
    return;
  }

  originLabel.textContent = `Origin: ${snapshot.origin}`;
  const isRunning = snapshot.running;
  runningPill.textContent = isRunning ? 'Running' : 'Fallback';
  runningPill.classList.toggle('running', isRunning);
  runningPill.classList.toggle('stopped', !isRunning);

  const telemetry = snapshot.telemetry;
  tickCountLabel.textContent = `Ticks: ${telemetry.ticks.length}`;
  commitCountLabel.textContent = `Commits: ${telemetry.commits.length}`;
  fallbackCountLabel.textContent = `Fallbacks: ${telemetry.fallbacks.length}`;

  const latestCommit = telemetry.commits[telemetry.commits.length - 1];
  if (latestCommit) {
    commitDurationLabel.textContent = `Duration: ${latestCommit.duration.toFixed(2)}ms`;
    commitPatchSizeLabel.textContent = `Patch size: ${latestCommit.patchSize}`;
    commitFingerprintLabel.textContent = `Fingerprint: ${latestCommit.fingerprint ?? 'n/a'}`;
    lastCommitLabel.textContent = `Last commit tick: ${latestCommit.tickId}`;
  } else {
    commitDurationLabel.textContent = 'Duration: —';
    commitPatchSizeLabel.textContent = 'Patch size: —';
    commitFingerprintLabel.textContent = 'Fingerprint: —';
    lastCommitLabel.textContent = 'Last commit: not yet recorded';
  }

  const fallback = telemetry.fallbacks[telemetry.fallbacks.length - 1];
  fallbackReasonLabel.textContent = fallback
    ? `Fallback status: ${fallback.reason} @ tick ${fallback.tick ?? 'unknown'}`
    : 'Fallback status: none';

  const diagnostics = snapshot.diagnostics;
  diagnosticsLabel.textContent = diagnostics.length > 0
    ? diagnostics
        .map((entry) => `${entry.metaKind} ${entry.reason} (tick ${entry.tickId})`)
        .join('\n')
    : 'No diagnostics yet';

  const lastBatch = snapshot.lastBatch;
  if (lastBatch) {
    lastBatchLabel.textContent = `${lastBatch.metaKind} (tick ${lastBatch.tickId ?? '??'})`;
  } else {
    lastBatchLabel.textContent = 'Last batch: not available';
  }

  const durations = latestCommit?.durations ?? {
    script_ms: latestCommit?.duration ?? 0,
    style_ms: 0,
    layout_ms: 0,
    render_ms: 0,
    total_ms: latestCommit?.duration ?? 0,
  };
  const totalDuration = durations.total_ms || latestCommit?.duration || 0;
  const baseDuration = Math.max(totalDuration, 1);

  updateWorkRow(workScriptBar, workScriptValue, durations.script_ms, baseDuration);
  updateWorkRow(workStyleBar, workStyleValue, durations.style_ms, baseDuration);
  updateWorkRow(workLayoutBar, workLayoutValue, durations.layout_ms, baseDuration);
  updateWorkRow(workRenderBar, workRenderValue, durations.render_ms, baseDuration);
  updateWorkRow(workTotalBar, workTotalValue, totalDuration, baseDuration);

  const workMetrics = latestCommit?.work ?? {};
  selectorCount.textContent = `${workMetrics.selectors_evaluated ?? 0}`;
  selectorElements.textContent = `${workMetrics.elements_invalidated ?? 0}`;
  selectorNodes.textContent = `${workMetrics.nodes_touched ?? 0}`;
  selectorInvalidationMs.textContent = `${(durations.selector_invalidation_ms ?? 0).toFixed(1)}ms`;
  selectorRestyled.textContent = `${workMetrics.restyled_elements ?? 0}`;

  const invalidationShare = ratio(durations.selector_invalidation_ms ?? 0, totalDuration);
  ratioInvalidationShare.textContent = `${(invalidationShare * 100).toFixed(1)}%`;
  ratioInvalidationsPerOp.textContent = formatRatio(
    workMetrics.elements_invalidated ?? 0,
    workMetrics.patch_ops ?? workMetrics.dom_mutations ?? 0
  );
  ratioSelectorsPerInvalidation.textContent = formatRatio(
    workMetrics.selectors_evaluated ?? 0,
    workMetrics.elements_invalidated ?? 0
  );

  updateRollingStats(telemetry.commits);

  const tickCount = telemetry.ticks.length;
  const fallbackCount = telemetry.fallbacks.length;
  const fallbackRate = tickCount ? (fallbackCount / tickCount) * 1000 : 0;
  guardrailRateLabel.textContent = `${fallbackRate.toFixed(1)} per 1k ticks`;
  guardrailCountLabel.textContent = `${fallbackCount}`;
  const latestFallback = fallback;
  guardrailReasonLabel.textContent = latestFallback
    ? `${latestFallback.reason} @ tick ${latestFallback.tick ?? 'unknown'}`
    : 'none';

  const commits = telemetry.commits;
  const latestFingerprint = commits[commits.length - 1]?.fingerprint;
  const previousFingerprint = commits[commits.length - 2]?.fingerprint;
  fingerprintValue.textContent = latestFingerprint != null ? String(latestFingerprint) : 'n/a';
  if (latestFingerprint == null) {
    fingerprintStability.textContent = 'pending fingerprint';
  } else if (previousFingerprint == null) {
    fingerprintStability.textContent = 'waiting for history';
  } else if (latestFingerprint === previousFingerprint) {
    fingerprintStability.textContent = 'stable';
  } else {
    fingerprintStability.textContent = 'changed';
  }
}

function updateWorkRow(bar, value, duration, max) {
  if (bar) {
    const percent = Math.min(100, Math.max(0, (duration / max) * 100));
    bar.style.width = `${percent}%`;
  }
  if (value) {
    value.textContent = `${duration.toFixed(1)}ms`;
  }
}

function ratio(numerator, denominator) {
  if (!denominator) {
    return 0;
  }
  return numerator / denominator;
}

function formatRatio(numerator, denominator) {
  if (!denominator) {
    return '0';
  }
  return (numerator / denominator).toFixed(2);
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, percentileValue) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1));
  return sorted[idx];
}

function updateRollingStats(commits) {
  const windowSize = 60;
  const slice = commits.slice(-windowSize);
  const totals = slice.map((commit) => commit?.durations?.total_ms ?? commit?.duration ?? 0);
  const selector = slice.map((commit) => commit?.durations?.selector_invalidation_ms ?? 0);
  const style = slice.map((commit) => commit?.durations?.style_recalc_ms ?? commit?.durations?.style_ms ?? 0);
  const layout = slice.map((commit) => commit?.durations?.layout_ms ?? 0);
  const render = slice.map((commit) => commit?.durations?.render_ms ?? 0);

  rollingTotalAvg.textContent = `${average(totals).toFixed(1)}ms`;
  rollingTotalP95.textContent = `${percentile(totals, 95).toFixed(1)}ms`;
  rollingSelectorAvg.textContent = `${average(selector).toFixed(1)}ms`;
  rollingStyleAvg.textContent = `${average(style).toFixed(1)}ms`;
  rollingLayoutAvg.textContent = `${average(layout).toFixed(1)}ms`;
  rollingRenderAvg.textContent = `${average(render).toFixed(1)}ms`;
}

function getCandidateTabs() {
  return new Promise((resolve) => {
    if (!chrome?.tabs?.query) {
      resolve([]);
      return;
    }
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const sorted = [...(tabs ?? [])].sort((a, b) => {
        if (a.active === b.active) {
          return 0;
        }
        return a.active ? -1 : 1;
      });
      resolve(sorted);
    });
  });
}

function sendRequestToTab(tabId, type, payload) {
  return new Promise((resolve) => {
    if (!tabId || !chrome?.tabs?.sendMessage) {
      resolve({ ok: false, error: 'No active tab' });
      return;
    }
    chrome.tabs.sendMessage(
      tabId,
      { channel: CHANNEL, type, payload },
      (response) => {
        const lastError = chrome.runtime?.lastError;
        if (lastError) {
          resolve({ ok: false, error: lastError.message });
          return;
        }
        resolve(response ?? { ok: false, error: 'No response from host' });
      }
    );
  });
}

async function sendRequest(type, payload) {
  const tabs = await getCandidateTabs();
  if (!tabs.length) {
    return { ok: false, error: 'No tabs available' };
  }
  for (const tab of tabs) {
    if (!tab?.id) {
      continue;
    }
    if (tab.url?.startsWith('chrome-extension://')) {
      continue;
    }
    const response = await sendRequestToTab(tab.id, type, payload);
    if (response?.ok) {
      return response;
    }
  }
  return { ok: false, error: 'No response from host' };
}

let refreshInFlight = false;

async function refreshSnapshot() {
  if (refreshInFlight) {
    return;
  }
  refreshInFlight = true;
  const response = await sendRequest('getSnapshot');
  refreshInFlight = false;
  if (response?.ok) {
    updateSurface(response.payload);
  } else {
    renderUnavailable(response?.error ?? 'awaiting host...');
  }
}

async function requestFallback() {
  const reason = fallbackReasonInput.value || 'manual override';
  const response = await sendRequest('requestFallback', { reason });
  if (response?.ok) {
    updateSurface(response.payload);
  }
}

async function resetSurface() {
  const response = await sendRequest('reset');
  if (response?.ok) {
    updateSurface(response.payload);
  }
}

fallbackButton.addEventListener('click', requestFallback);
resetButton.addEventListener('click', resetSurface);
if (exportButton) {
  exportButton.addEventListener('click', async () => {
    const response = await sendRequest('getSnapshot');
    if (!response?.ok) {
      renderUnavailable(response?.error ?? 'export failed');
      return;
    }
    const snapshot = response.payload;
    const json = JSON.stringify(
      snapshot?.telemetry ?? {},
      (key, value) => (typeof value === 'bigint' ? value.toString() : value),
      2
    );
    const origin = snapshot?.origin ?? 'unknown-origin';
    const safeOrigin = origin.replace(/[^a-zA-Z0-9.-]+/g, '_');
    const filename = `phase6-telemetry-${safeOrigin}-${Date.now()}.json`;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  });
}
if (openWindowButton) {
  openWindowButton.addEventListener('click', () => {
    if (!chrome?.windows?.create) {
      return;
    }
    chrome.windows.create({
      url: chrome.runtime.getURL('ui.html'),
      type: 'popup',
      width: 1100,
      height: 800,
    });
  });
}

setInterval(refreshSnapshot, 1000);
refreshSnapshot();

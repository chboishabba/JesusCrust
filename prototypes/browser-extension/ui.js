import { startGuardedBrowserHost } from './host.js?browser=1';

startGuardedBrowserHost();
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

const guardrailRateLabel = document.getElementById('guardrail-rate');
const guardrailCountLabel = document.getElementById('guardrail-count');
const guardrailReasonLabel = document.getElementById('guardrail-reason');

const fingerprintValue = document.getElementById('fingerprint-value');
const fingerprintStability = document.getElementById('fingerprint-stability');

function updateSurface() {
  const surface = window.__versoGuardedHost;
  if (!surface) {
    originLabel.textContent = 'Origin: guardrail host loading…';
    runningPill.textContent = 'Initializing';
    runningPill.classList.remove('running', 'stopped');
    runningPill.classList.add('stopped');
    return;
  }

  originLabel.textContent = `Origin: ${surface.origin}`;
  const isRunning = surface.running();
  runningPill.textContent = isRunning ? 'Running' : 'Fallback';
  runningPill.classList.toggle('running', isRunning);
  runningPill.classList.toggle('stopped', !isRunning);

  const telemetry = surface.getTelemetry();
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

  const diagnostics = surface.getDiagnostics();
  diagnosticsLabel.textContent = diagnostics.length > 0
    ? diagnostics
        .map((entry) => `${entry.metaKind} ${entry.reason} (tick ${entry.tickId})`)
        .join('\n')
    : 'No diagnostics yet';

  const lastBatch = surface.getLastBatch();
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

function requestFallback() {
  const surface = window.__versoGuardedHost;
  if (!surface) {
    return;
  }
  const reason = fallbackReasonInput.value || 'manual override';
  surface.requestFallback(reason);
}

function resetSurface() {
  const surface = window.__versoGuardedHost;
  if (!surface) {
    return;
  }
  surface.reset();
}

fallbackButton.addEventListener('click', requestFallback);
resetButton.addEventListener('click', resetSurface);

setInterval(updateSurface, 1000);
updateSurface();

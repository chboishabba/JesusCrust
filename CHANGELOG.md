# Changelog

## Unreleased

- Documented the Phase 6 guardrail host UI surface and telemetry contract so contributors know how the extension controls interact with `window.__versoGuardedHost`.
- Added the guarded browser host prototype plus telemetry helper and UI telemetry dashboard so guardrails can show runtime stats, fallback reasons, and control surfaces in the browser shell.
- Added `manifest.json` plus docs describing how the extension packages the content script injection + popup UI so Verso always wires telemetry/fallback controls to `host.js`/`ui.html`.
- Pointed the manifest content script at `host-entry.js`, which dynamically imports `host.js?browser=1` in classic script mode so MV3 keeps using ESM, and documented that the UI/adapter imports append `?browser=1` so browsers reload the browser-only bundle instead of parsing Node built-ins.
- Fixed the Phase 6 UI popup so `ui.js` is loaded via `<script type="module">`, eliminating the “Cannot use import statement outside a module” console errors.
- Created `prototypes/browser-extension/test-host-flow.js` to replay fallback/reset transitions and confirmed the script passes in Node (`node test-host-flow.js`).

## v0.1.0 — 2026-01-14

- Phase 1: QuickJS harness with fake DOM, transactional effect log, microtask draining, and deterministic replay
- Phase 2: Rust core with deterministic graph/store/selector, patch ops, scheduler, and engine batching
- Phase 3: JS host with DOM-equivalent model, mutation guard, commit boundary enforcement, replay + fingerprint, rollback/fallback no-ops, documented host-core API
- Phase 4: Developer experience docs and runnable quickstart example

Milestone: Initial end-to-end semantics proven and documented.

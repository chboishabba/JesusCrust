import { createDropInHost } from './adapter.js';
import assert from 'node:assert/strict';

const host = createDropInHost();
host.beginTick();
host.ensureNodeWithKey('fallback-root', 'div');
host.fallback('diagnostic-watch');

const diagnostics = host.getDiagnostics();
const fallbackEntry = diagnostics.find((entry) => entry.metaKind === 'fallback');
assert.ok(fallbackEntry, 'fallback should be logged');
assert.strictEqual(fallbackEntry.reason, 'diagnostic-watch');
assert.strictEqual(host.getLastBatch()?.metaKind, 'fallback');

// After fallback we can start a new tick without error.
host.beginTick();
host.commit();

console.log('Fallback diagnostics recorded and host ready for next tick');

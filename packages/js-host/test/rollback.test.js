import assert from 'node:assert/strict';
import test from 'node:test';
import { createRunner } from '../src/runner.js';

const commitBatch = {
  metaKind: 'commit',
  ops: [
    { kind: 'EnsureNode', nodeId: 1, tag: 'div' },
    { kind: 'SetText', nodeId: 1, value: 'live' },
  ],
};

test('rollback batches do not mutate DOM', () => {
  const runner = createRunner();
  runner.beginTick();
  runner.commitBatch(commitBatch);
  const snapshotAfterCommit = runner.snapshot();

  runner.beginTick();
  const rollback = { metaKind: 'rollback', ops: [] };
  const snapshotRollback = runner.commitBatch(rollback);

  assert.equal(snapshotRollback, snapshotAfterCommit);
});

test('fallback batches do not mutate DOM', () => {
  const runner = createRunner();
  runner.beginTick();
  runner.commitBatch(commitBatch);
  const snapshotAfterCommit = runner.snapshot();

  runner.beginTick();
  const fallback = { metaKind: 'fallback', ops: [] };
  const snapshotFallback = runner.commitBatch(fallback);

  assert.equal(snapshotFallback, snapshotAfterCommit);
});

test('rollback with ops is rejected', () => {
  const runner = createRunner();
  runner.beginTick();
  const badRollback = { metaKind: 'rollback', ops: [{ kind: 'SetText', nodeId: 99, value: 'bad' }] };
  assert.throws(() => runner.commitBatch(badRollback), /must not carry ops/);
});

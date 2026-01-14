import assert from 'node:assert/strict';
import test from 'node:test';
import { createRunner } from '../src/runner.js';

const patch = {
  ops: [
    { kind: 'EnsureNode', nodeId: 1, tag: 'div' },
    { kind: 'SetText', nodeId: 1, value: 'tick' },
  ],
};

test('applies a single commit per tick and updates state once', () => {
  const runner = createRunner();

  runner.beginTick();
  const before = runner.snapshot();
  const after = runner.commitBatch(patch);

  assert.equal(before, '[]');
  const parsed = JSON.parse(after);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].text, 'tick');
});

test('rejects commit without begin', () => {
  const runner = createRunner();
  assert.throws(() => runner.commitBatch(patch), /Tick not started/);
});

test('rejects multiple commits in the same tick', () => {
  const runner = createRunner();
  runner.beginTick();
  runner.commitBatch(patch);
  assert.throws(() => runner.commitBatch(patch), /Tick not started|already committed/);
});

test('guards against mutation outside commit', () => {
  const runner = createRunner();
  assert.throws(() => runner.dom.ensureNode(1, 'div'), /Mutation outside commitBatch/);
});

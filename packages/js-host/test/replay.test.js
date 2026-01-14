import assert from 'node:assert/strict';
import test from 'node:test';
import { createDomModel } from '../src/dom.js';
import { applyPatchBatch } from '../src/apply.js';
import { replayBatch, fingerprintFromSerialized } from '../src/replay.js';

const baseBatch = {
  ops: [
    { kind: 'EnsureNode', nodeId: 1, tag: 'div' },
    { kind: 'EnsureNode', nodeId: 2, tag: 'span' },
    { kind: 'AppendChild', parentId: 1, childId: 2 },
    { kind: 'SetText', nodeId: 2, value: 'hello' },
  ],
};

test('replay produces identical serialized output and fingerprint', () => {
  const initial = createDomModel();
  const initialSerialized = initial.serialize();

  const resultA = replayBatch(initialSerialized, baseBatch);
  const resultB = replayBatch(initialSerialized, baseBatch);

  assert.equal(resultA.serialized, resultB.serialized);
  assert.equal(resultA.fingerprint, resultB.fingerprint);
});

test('fingerprint matches manual hash of serialized state', () => {
  const dom = createDomModel();
  dom.runMutating(() => applyPatchBatch(dom, baseBatch));
  const serialized = dom.serialize();

  const replayed = replayBatch('[]', baseBatch);
  const manual = fingerprintFromSerialized(serialized);

  assert.equal(replayed.fingerprint, manual);
});

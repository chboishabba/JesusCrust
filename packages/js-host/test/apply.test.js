import assert from 'node:assert/strict';
import test from 'node:test';
import { createDomModel } from '../src/dom.js';
import { applyPatchBatch } from '../src/apply.js';

const baseBatch = {
  ops: [
    { kind: 'EnsureNode', nodeId: 1, tag: 'div' },
    { kind: 'EnsureNode', nodeId: 2, tag: 'span' },
    { kind: 'AppendChild', parentId: 1, childId: 2 },
    { kind: 'SetText', nodeId: 2, value: 'hello' },
    { kind: 'SetAttr', nodeId: 1, name: 'class', value: 'root' },
  ],
};

test('applies ops in order with deterministic serialization', () => {
  const dom = createDomModel();
  dom.runMutating(() => applyPatchBatch(dom, baseBatch));

  const serialized = dom.serialize();
  const expected = [
    {
      id: 1,
      tag: 'div',
      text: '',
      attrs: [['class', 'root']],
      children: [2],
      parent: null,
    },
    {
      id: 2,
      tag: 'span',
      text: 'hello',
      attrs: [],
      children: [],
      parent: 1,
    },
  ];

  assert.deepEqual(JSON.parse(serialized), expected);
});

test('ensureNode is idempotent and serializer is stable across runs', () => {
  const batch = {
    ops: [
      { kind: 'EnsureNode', nodeId: 1, tag: 'p' },
      { kind: 'EnsureNode', nodeId: 1, tag: 'p' },
      { kind: 'SetText', nodeId: 1, value: 'once' },
    ],
  };

  const first = createDomModel();
  first.runMutating(() => applyPatchBatch(first, batch));
  const firstSerialized = first.serialize();

  const second = createDomModel();
  second.runMutating(() => applyPatchBatch(second, batch));
  const secondSerialized = second.serialize();

  assert.equal(firstSerialized, secondSerialized);
});

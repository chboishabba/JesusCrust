import assert from 'node:assert/strict';
import { createDropInHost } from './adapter.js';
import { renderPreactTree } from './preact-renderer.js';
import { virtualList } from './virtualizer.js';

const host = createDropInHost();
const totalRows = 20;
const rows = Array.from({ length: totalRows }, (_, idx) => ({ id: idx, label: `Row ${idx}` }));
const windowSize = 5;
let rowMap = new Map();

function renderWindow(offset) {
  host.beginTick();
  const start = offset;
  const end = Math.min(offset + windowSize, rows.length);
  const currentKeys = new Set(
    rows.slice(start, end).map((row) => `preact-root:row-${row.id}`)
  );
  for (const [key, nodeId] of rowMap) {
    if (!currentKeys.has(key)) {
      host.removeNode(nodeId);
    }
  }
  const nodes = renderPreactTree(host, virtualList(rows, offset, windowSize));
  const result = host.commit();
  const nextMap = new Map();
  for (const [key, nodeId] of nodes) {
    if (key.startsWith('preact-root:row-')) {
      nextMap.set(key, nodeId);
    }
  }
  rowMap = nextMap;
  return { ...result, nodes };
}

const first = renderWindow(0);
const second = renderWindow(3);
const third = renderWindow(8);

const firstTree = JSON.parse(first.serialized);
const secondTree = JSON.parse(second.serialized);
const thirdTree = JSON.parse(third.serialized);

assert.strictEqual(firstTree.length, windowSize + 2, 'first window shows only visible nodes');
assert.strictEqual(secondTree.length, windowSize + 2, 'second window shows only visible nodes');
assert.strictEqual(thirdTree.length, windowSize + 2, 'third window shows only visible nodes');

[3, 4].forEach((rowId) => {
  const key = `preact-root:virtual-list:row-${rowId}`;
  assert.strictEqual(first.nodes.get(key), second.nodes.get(key), `NodeId for row ${rowId} stays stable`);
});

const diag = host.getDiagnostics();
assert.strictEqual(diag.length, 3, 'three commits recorded for three windows');
console.log('Virtualization test proves limited commits and stable identities');

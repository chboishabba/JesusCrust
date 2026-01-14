import { h } from 'preact';
import assert from 'node:assert/strict';
import { createDropInHost } from './adapter.js';
import { renderPreactTree } from './preact-renderer.js';

const host = createDropInHost();

const List = ({ items }) =>
  h(
    'ul',
    { class: 'keyed-list' },
    ...items.map((value) =>
      h(
        'li',
        { key: `item-${value}`, class: 'keyed-item' },
        value
      )
    )
  );

function renderList(items) {
  host.beginTick();
  const nodes = renderPreactTree(host, h(List, { items }));
  const result = host.commit();
  return { ...result, nodes };
}

const firstOrder = ['A', 'B', 'C'];
const secondOrder = ['C', 'A', 'B'];
const first = renderList(firstOrder);
const second = renderList(secondOrder);

firstOrder.forEach((value) => {
  const keyPath = `preact-root:item-${value}`;
  const firstId = first.nodes.get(keyPath);
  const secondId = second.nodes.get(keyPath);
  assert.strictEqual(
    firstId,
    secondId,
    `NodeId for ${value} must stay stable across reorder`
  );
});

console.log('Keyed reorder preserves identities');

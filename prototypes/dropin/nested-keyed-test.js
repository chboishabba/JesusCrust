import assert from 'node:assert/strict';
import { h } from 'preact';
import { createDropInHost } from './adapter.js';
import { renderPreactTree } from './preact-renderer.js';

const host = createDropInHost();

function KeyedGroup({ groups }) {
  return h(
    'div',
    { class: 'group-root' },
    ...groups.map((group) =>
      h(
        'section',
        { key: `group-${group.id}`, class: 'group' },
        h('h3', null, group.label),
        h(
          'ul',
          { role: 'list', key: `list-${group.id}` },
          ...group.items.map((item) =>
            h('li', { key: `item-${item.id}`, class: 'group-item' }, item.label)
          )
        )
      )
    )
  );
}

function commitGroups(groups) {
  host.beginTick();
  const nodes = renderPreactTree(host, h(KeyedGroup, { groups }));
  const result = host.commit();
  return { ...result, nodes };
}

const firstGroups = [
  { id: 'alpha', label: 'Group Alpha', items: [{ id: 'x', label: 'Item X' }, { id: 'y', label: 'Item Y' }] },
  { id: 'beta', label: 'Group Beta', items: [{ id: 'p', label: 'Item P' }, { id: 'q', label: 'Item Q' }] },
];

const secondGroups = [
  { id: 'beta', label: 'Group Beta', items: [{ id: 'q', label: 'Item Q' }, { id: 'p', label: 'Item P' }] },
  { id: 'alpha', label: 'Group Alpha', items: [{ id: 'y', label: 'Item Y' }, { id: 'x', label: 'Item X' }] },
];

const first = commitGroups(firstGroups);
const second = commitGroups(secondGroups);

const keysToCheck = [
  'preact-root:group-alpha',
  'preact-root:group-beta',
  'preact-root:group-alpha:list-alpha',
  'preact-root:group-beta:list-beta',
  'preact-root:group-alpha:list-alpha:item-x',
  'preact-root:group-alpha:list-alpha:item-y',
  'preact-root:group-beta:list-beta:item-p',
  'preact-root:group-beta:list-beta:item-q',
];

keysToCheck.forEach((key) => {
  const firstId = first.nodes.get(key);
  const secondId = second.nodes.get(key);
  assert.strictEqual(firstId, secondId, `NodeId for ${key} must be stable across merges`);
});

console.log('Nested keyed list preserves identity across reorders and spidered child nodes');

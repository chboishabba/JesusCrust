import assert from 'node:assert/strict';
import { h } from 'preact';
import { createDropInHost } from './adapter.js';
import { renderPreactTree } from './preact-renderer.js';

const host = createDropInHost();

function render(toggle) {
  host.beginTick();
  const node = h(
    'div',
    { key: 'root' },
    h('span', null, 'fixed'),
    toggle && h('section', { key: 'cond-section' }, 'conditional')
  );
  const nodes = renderPreactTree(host, node);
  const result = host.commit();
  return { nodes, result };
}

const first = render(false);
const second = render(true);
const third = render(false);
const fourth = render(true);

const conditionalKey = 'preact-root:cond-section';
const secondId = second.nodes.get(conditionalKey);
const thirdId = third.nodes.get(conditionalKey);
const fourthId = fourth.nodes.get(conditionalKey);
assert.ok(secondId, 'conditional block should exist when toggled on');
assert.strictEqual(thirdId, undefined, 'conditional block removed when toggled off');
assert.strictEqual(fourthId, secondId, 'conditional NodeId stays stable when toggled back on');

console.log('Conditional keyed mount toggles without identity churn');

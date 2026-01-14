import { h } from 'preact';
import assert from 'node:assert/strict';
import { createDropInHost } from './adapter.js';
import { renderPreactTree } from './preact-renderer.js';

const host = createDropInHost();

const StatefulApp = ({ label }) =>
  h(
    'div',
    { class: 'state-root' },
    h(
      'button',
      {
        class: 'state-button',
        key: 'state-button',
      },
      label
    )
  );

function renderState(label) {
  host.beginTick();
  const nodes = renderPreactTree(host, h(StatefulApp, { label }));
  const result = host.commit();
  return { ...result, nodes };
}

const first = renderState('state-one');
const buttonId = first.nodes.get('preact-root:state-button');
assert.ok(buttonId, 'button node should exist');

let second;
host.addEventListener(buttonId, 'click', () => {
  second = renderState('state-two');
});

host.dispatchEvent(buttonId, 'click', { event: 'state-updated' });
assert.ok(second, 'event handler should trigger second render');
assert.ok(second.serialized.includes('state-two'));
assert.notStrictEqual(first.fingerprint.toString(), second.fingerprint.toString());
console.log('Stateful re-render test passed');

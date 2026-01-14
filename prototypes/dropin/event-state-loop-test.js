import assert from 'node:assert/strict';
import { h } from 'preact';
import { createDropInHost } from './adapter.js';
import { renderPreactTree } from './preact-renderer.js';

const host = createDropInHost();

function renderLabel(label) {
  host.beginTick();
  const nodes = renderPreactTree(
    host,
    h(
      'div',
      { key: 'frame' },
      h('button', { key: 'event-button' }, label)
    )
  );
  const result = host.commit();
  return { ...result, nodes };
}

const first = renderLabel('start');
const buttonId = first.nodes.get('preact-root:event-button');
assert.ok(buttonId, 'renderer should expose button node id');

let second;
host.addEventListener(buttonId, 'click', (event) => {
  second = renderLabel(event.detail.next);
});

host.dispatchEvent(buttonId, 'click', { next: 'looped' });
assert.ok(second, 'event handler should rerender');
assert.ok(second.serialized.includes('looped'));

const diagnostics = host.getDiagnostics();
assert.strictEqual(diagnostics.length, 2, 'two commits should be logged');
assert.strictEqual(diagnostics[0].metaKind, 'commit');
assert.strictEqual(diagnostics[1].metaKind, 'commit');
console.log('Event → state loop maintains commit invariants and logs diagnostics');

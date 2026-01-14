import { createDropInHost } from './adapter.js';

const host = createDropInHost();

host.addEventListener(1, 'click', (event) => {
  console.log('Event handled on node 1:', event.detail);
});

function tick(writeFn) {
  host.beginTick();
  writeFn(host);
  const result = host.commit();
  console.log('Serialized DOM:', result.serialized);
  console.log('Fingerprint:', result.fingerprint.toString());
  // Simulate third-party widget triggering a click after commit
  host.dispatchEvent(1, 'click', { source: 'widget', data: result.serialized });
  return result;
}

const writesA = (host) => {
  host.ensureNode(1, 'div');
  host.setAttr(1, 'class', 'first');
  host.setText(1, 'Phase 5 tick');
};

const writesB = (host) => {
  host.ensureNode(1, 'div');
  host.setAttr(1, 'class', 'second');
  host.setText(1, 'Drop-in prototype');
};

// First tick applies initial writes
tick(writesA);
// Second tick updates text/attrs; ensures same node still deterministic
tick(writesB);

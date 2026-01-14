import { createDropInHost } from './adapter.js';

const host = createDropInHost();

function tick(writeFn) {
  host.beginTick();
  writeFn(host);
  const result = host.commit();
  console.log('Serialized DOM:', result.serialized);
  console.log('Fingerprint:', result.fingerprint.toString());
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

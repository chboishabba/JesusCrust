import { createDropInHost } from './adapter.js';
import { createView, renderView } from './framework.js';

const host = createDropInHost();

function tick(label, color) {
  host.beginTick();
  const view = createView(label, color);
  renderView(host, view);
  const { serialized, fingerprint } = host.commit();
  console.log('Framework render serialized:', serialized);
  console.log('Framework fingerprint:', fingerprint.toString());
}

host.addEventListener(1, 'click', (event) => {
  console.log('Framework host received click:', event.detail);
});

tick('Preact-style render', '#007acc');
tick('Second frame', '#ff8800');

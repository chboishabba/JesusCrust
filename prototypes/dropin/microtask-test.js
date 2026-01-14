import { createDropInHost } from './adapter.js';

async function main() {
  const host = createDropInHost();

  host.beginTick();
  const rootId = host.ensureNodeWithKey('micro:root', 'div');
  host.setText(rootId, 'initial');

  Promise.resolve().then(() => {
    host.setText(rootId, 'microtask update');
  });

  await Promise.resolve();

  const result = host.commit();
  console.log('Microtask serialized:', result.serialized);
  console.log('Microtask fingerprint:', result.fingerprint.toString());
}

main();

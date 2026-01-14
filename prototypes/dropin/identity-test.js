import { createDropInHost } from './adapter.js';

const host = createDropInHost();
host.beginTick();
const firstId = host.ensureNodeWithKey('identity:item', 'div');
host.commit();
host.beginTick();
const secondId = host.ensureNodeWithKey('identity:item', 'div');
host.commit();
if (firstId !== secondId) {
  throw new Error('Node identity diverged between ticks');
}
console.log('Identity stable:', firstId);

import { createDropInHost } from './adapter.js';

function run() {
  const host = createDropInHost();
  host.beginTick();
  const rootId = host.ensureNodeWithKey('rollback:root', 'div');
  host.setText(rootId, 'before rollback');
  const before = host.commit();

  host.beginTick();
  host.setText(rootId, 'should rollback');
  host.layoutRead();
  const after = host.commit();

  if (before.serialized !== after.serialized) {
    throw new Error('Serialized DOM changed despite rollback');
  }
  console.log('Rollback-guarded serialized state unchanged');
}

run();

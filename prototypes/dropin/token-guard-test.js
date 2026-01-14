import { createDropInHost } from './adapter.js';
import assert from 'node:assert/strict';

const host = createDropInHost();
const firstToken = host.beginTick();
const rootId = host.ensureNodeWithKey('token:root', 'div');
host.commit(firstToken);

host.beginTick();
assert.throws(
  () => host.setText(rootId, 'reuse', firstToken),
  /Token belongs to a different tick/,
  'Reusing a token from a previous tick must fail'
);
host.rollback('token test');

const thirdToken = host.beginTick();
host.ensureNodeWithKey('token:root', 'div');
host.commit(thirdToken);

console.log('Token guard test passed');

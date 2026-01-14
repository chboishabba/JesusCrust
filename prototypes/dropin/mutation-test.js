import { createDropInHost } from './adapter.js';

function expectThrow(fn, message) {
  let threw = false;
  try {
    fn();
  } catch (error) {
    threw = true;
    console.log(`${message}:`, error.message);
  }
  if (!threw) {
    throw new Error(`Expected throw for: ${message}`);
  }
}

const host = createDropInHost();
expectThrow(() => host.setText(1, 'oops'), 'Mutation before tick should fail');
host.beginTick();
host.ensureNodeWithKey('mutation:root', 'div');
host.commit();
expectThrow(() => host.setText(1, 'oops again'), 'Mutation after tick should fail');
console.log('Mutation guard works');

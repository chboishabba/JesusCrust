import { createDropInHost } from './adapter.js';

function run() {
  const host = createDropInHost();
  let thrown = null;

  try {
    host.setText(1, 'should fail');
  } catch (err) {
    thrown = err;
  }

  if (!thrown) {
    throw new Error('setText outside a tick should throw to keep the semantic gate intact');
  }

  if (!/tick/i.test(thrown.message)) {
    throw new Error('tick guard should be the reason for rejecting writes');
  }

  console.log('Semantic gate: writes require beginTick');
}

run();

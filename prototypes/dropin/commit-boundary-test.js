import { createDropInHost } from './adapter.js';

function run() {
  const host = createDropInHost();
  const token = host.beginTick('t1');
  host.ensureNode(1, 'div', token);
  host.setText(1, 'start', token);
  host.commit(token);

  let threw = false;
  try {
    host.setText(1, 'after-commit');
  } catch (err) {
    threw = true;
    if (!/tick/i.test(err.message) && !/commit/i.test(err.message)) {
      throw new Error('post-commit writes should fail with a tick/commit boundary message');
    }
  }

  if (!threw) {
    throw new Error('host must reject writes after commit()');
  }

  console.log('Commit boundary: post-commit writes are rejected');
}

run();

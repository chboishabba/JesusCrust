import { createDropInHost } from './adapter.js';
import { createRunner } from '../packages/js-host/src/runner.js';

const host = createDropInHost();
host.beginTick();
const rootId = host.ensureNodeWithKey('replay:root', 'div');
host.setText(rootId, 'recorded');
host.setAttr(rootId, 'data-test', 'true');
const result = host.commit();
const recordedBatch = host.getLastBatch();

const replayRunner = createRunner();
replayRunner.beginTick();
replayRunner.commitBatch(recordedBatch);
const replayed = replayRunner.snapshot();

if (replayed !== result.serialized) {
  throw new Error('Replayed serialization differs');
}
console.log('Replay serialization matches original');

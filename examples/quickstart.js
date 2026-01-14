import { createRunner } from '../packages/js-host/src/runner.js';
import { fingerprintFromSerialized } from '../packages/js-host/src/replay.js';

const runner = createRunner();

const batch = {
  metaKind: 'commit',
  ops: [
    { kind: 'EnsureNode', nodeId: 1, tag: 'div' },
    { kind: 'EnsureNode', nodeId: 2, tag: 'span' },
    { kind: 'AppendChild', parentId: 1, childId: 2 },
    { kind: 'SetAttr', nodeId: 1, name: 'class', value: 'root' },
    { kind: 'SetText', nodeId: 2, value: 'hello, world' },
  ],
};

runner.beginTick();
const serialized = runner.commitBatch(batch);
const fingerprint = fingerprintFromSerialized(serialized);

console.log('Serialized DOM:', serialized);
console.log('Fingerprint (u64):', fingerprint.toString());

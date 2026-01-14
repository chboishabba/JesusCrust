import { createRunner } from '../../packages/js-host/src/runner.js';
import { fingerprintFromSerialized } from '../../packages/js-host/src/replay.js';

const ensurePatch = (kind, payload) => ({ kind, ...payload });

export function createDropInHost() {
  const runner = createRunner();
  let pendingOps = [];
  let inTick = false;

  function beginTick() {
    runner.beginTick();
    pendingOps = [];
    inTick = true;
  }

  function ensureNode(nodeId, tag) {
    checkTick();
    pendingOps.push(ensurePatch('EnsureNode', { nodeId, tag }));
  }

  function setText(nodeId, value) {
    checkTick();
    pendingOps.push(ensurePatch('SetText', { nodeId, value }));
  }

  function setAttr(nodeId, name, value) {
    checkTick();
    pendingOps.push(ensurePatch('SetAttr', { nodeId, name, value }));
  }

  function appendChild(parentId, childId) {
    checkTick();
    pendingOps.push(ensurePatch('AppendChild', { parentId, childId }));
  }

  function checkTick() {
    if (!inTick) {
      throw new Error('Writes must happen inside a tick');
    }
  }

  function commit() {
    if (!inTick) {
      throw new Error('Tick not started');
    }
    const batch = {
      metaKind: 'commit',
      ops: pendingOps,
    };
    const serialized = runner.commitBatch(batch);
    const fingerprint = fingerprintFromSerialized(serialized);
    inTick = false;
    return { serialized, fingerprint };
  }

  return { beginTick, ensureNode, setText, setAttr, appendChild, commit };
}

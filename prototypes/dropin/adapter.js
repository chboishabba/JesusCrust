import { createRunner } from '../../packages/js-host/src/runner.js';
import { fingerprintFromSerialized } from '../../packages/js-host/src/replay.js';

const ensurePatch = (kind, payload) => ({ kind, ...payload });

export function createDropInHost() {
  const runner = createRunner();
  let pendingOps = [];
  let inTick = false;
  const listeners = new Map();
  const identity = new Map([['root', 1]]);
  let nextId = 2;
  let lastBatch = null;

  function beginTick() {
    runner.beginTick();
    pendingOps = [];
    inTick = true;
  }

  function ensureNode(nodeId, tag) {
    checkTick();
    pendingOps.push(ensurePatch('EnsureNode', { nodeId, tag }));
    return nodeId;
  }

  function ensureNodeWithKey(key, tag) {
    checkTick();
    if (!key) {
      throw new Error('Key required for identity tracking');
    }
    let nodeId = identity.get(key);
    if (!nodeId) {
      nodeId = nextId++;
      identity.set(key, nodeId);
    }
    pendingOps.push(ensurePatch('EnsureNode', { nodeId, tag }));
    return nodeId;
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
    lastBatch = { metaKind: 'commit', ops: pendingOps.map((op) => ({ ...op })) };
    pendingOps = [];
    return { serialized, fingerprint };
  }

  function addEventListener(nodeId, type, handler) {
    const key = `${nodeId}:${type}`;
    const handlers = listeners.get(key) ?? [];
    handlers.push(handler);
    listeners.set(key, handlers);
  }

  function dispatchEvent(nodeId, type, detail = {}) {
    const key = `${nodeId}:${type}`;
    const handlers = listeners.get(key) || [];
    const event = { type, detail };
    for (const handler of handlers) {
      handler(event);
    }
  }

  function rollback(reason) {
    if (!inTick) {
      throw new Error('Tick not started for rollback');
    }
    pendingOps = [];
    const serialized = runner.commitBatch({ metaKind: 'rollback', ops: [] });
    inTick = false;
    return serialized;
  }

  function layoutRead() {
    return rollback('layout read');
  }

  function getLastBatch() {
    return lastBatch;
  }

  return {
    beginTick,
    ensureNode,
    ensureNodeWithKey,
    setText,
    setAttr,
    appendChild,
    commit,
    addEventListener,
    dispatchEvent,
    rollback,
    layoutRead,
    getLastBatch,
  };
}

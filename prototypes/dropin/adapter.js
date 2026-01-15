import { createRunner } from '../../packages/js-host/src/runner.js';
import { fingerprintFromSerialized } from '../../packages/js-host/src/replay.js?browser=1';

const ensurePatch = (kind, payload) => ({ kind, ...payload });

export function createDropInHost() {
  const runner = createRunner();
  let pendingOps = [];
  let inTick = false;
  const listeners = new Map();
  const identity = new Map([['root', 1]]);
  let nextId = 2;
  let lastBatch = null;
  let diagnostics = [];
  let tickCounter = 0;
  let currentTickId = 0;
  let currentToken = null;
  let tokenCounter = 0;

  function beginTick() {
    tickCounter += 1;
    currentTickId = tickCounter;
    runner.beginTick();
    pendingOps = [];
    inTick = true;
    currentToken = {
      tickId: currentTickId,
      consumed: false,
      id: `${currentTickId}:${++tokenCounter}`,
    };
    return currentToken;
  }

  function ensureToken(token) {
    if (!inTick) {
      throw new Error('Writes must happen inside a tick');
    }
    const active = token ?? currentToken;
    if (!active) {
      throw new Error('Active tick token required');
    }
    if (active.tickId !== currentTickId) {
      throw new Error('Token belongs to a different tick');
    }
    if (active.consumed) {
      throw new Error('Token already consumed');
    }
    return active;
  }

  function ensureNode(nodeId, tag, token) {
    ensureToken(token);
    pendingOps.push(ensurePatch('EnsureNode', { nodeId, tag }));
    return nodeId;
  }

  function ensureNodeWithKey(key, tag, token) {
    ensureToken(token);
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

  function setText(nodeId, value, token) {
    ensureToken(token);
    pendingOps.push(ensurePatch('SetText', { nodeId, value }));
  }

  function setAttr(nodeId, name, value, token) {
    ensureToken(token);
    pendingOps.push(ensurePatch('SetAttr', { nodeId, name, value }));
  }

  function appendChild(parentId, childId, token) {
    ensureToken(token);
    pendingOps.push(ensurePatch('AppendChild', { parentId, childId }));
  }

  function removeNode(nodeId, token) {
    ensureToken(token);
    pendingOps.push(ensurePatch('Remove', { nodeId }));
  }

  function commit(token) {
    if (!inTick) {
      throw new Error('Tick not started');
    }
    const activeToken = ensureToken(token);
    const batch = {
      metaKind: 'commit',
      ops: pendingOps,
    };
    const serialized = runner.commitBatch(batch);
    const fingerprint = fingerprintFromSerialized(serialized);
    inTick = false;
    activeToken.consumed = true;
    lastBatch = {
      metaKind: 'commit',
      ops: pendingOps.map((op) => ({ ...op })),
      tickId: currentTickId,
    };
    pendingOps = [];
    recordDiagnostic('commit', `tick-${currentTickId}`, fingerprint);
    currentToken = null;
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

  function rollback(reason, token) {
    ensureToken(token);
    if (!inTick) {
      throw new Error('Tick not started for rollback');
    }
    pendingOps = [];
    const serialized = runner.commitBatch({ metaKind: 'rollback', ops: [] });
    inTick = false;
    currentToken.consumed = true;
    recordDiagnostic('rollback', reason ?? 'rollback', null);
    lastBatch = { metaKind: 'rollback', reason };
    currentToken = null;
    return serialized;
  }

  function fallback(reason, token) {
    ensureToken(token);
    if (!inTick) {
      throw new Error('Tick not started for fallback');
    }
    pendingOps = [];
    const serialized = runner.commitBatch({ metaKind: 'fallback', ops: [] });
    inTick = false;
    currentToken.consumed = true;
    recordDiagnostic('fallback', reason ?? 'fallback', null);
    lastBatch = { metaKind: 'fallback', reason };
    currentToken = null;
    return serialized;
  }

  function layoutRead(token) {
    return rollback('layout read', token);
  }

  function recordDiagnostic(metaKind, reason, fingerprint) {
    diagnostics.push({
      tickId: currentTickId,
      metaKind,
      reason,
      fingerprint: fingerprint ? fingerprint.toString() : null,
    });
  }

  function getDiagnostics() {
    return [...diagnostics];
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
    removeNode,
    commit,
    addEventListener,
    dispatchEvent,
    rollback,
    layoutRead,
    fallback,
    getLastBatch,
    getDiagnostics,
  };
}

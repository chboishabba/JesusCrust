import { createHash } from 'node:crypto';
import { createDomModelFromSerialized } from './dom.js';
import { applyPatchBatch } from './apply.js';

export function fingerprintFromSerialized(serialized) {
  const hash = createHash('sha256').update(serialized).digest();
  let value = 0n;
  for (let i = 7; i >= 0; i -= 1) {
    value = (value << 8n) | BigInt(hash[i]);
  }
  return value;
}

export function replayBatch(initialSerialized, batch) {
  const model = createDomModelFromSerialized(initialSerialized);
  model.runMutating(() => applyPatchBatch(model, batch));
  const serialized = model.serialize();
  const fingerprint = fingerprintFromSerialized(serialized);
  return { serialized, fingerprint };
}

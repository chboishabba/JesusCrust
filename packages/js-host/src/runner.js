import { DomModel, createDomModel } from './dom.js';
import { applyPatchBatch } from './apply.js';

export class HostRunner {
  constructor(dom = createDomModel()) {
    if (!(dom instanceof DomModel)) {
      throw new Error('HostRunner expects a DomModel');
    }
    this.dom = dom;
    this.inTick = false;
    this.committed = false;
  }

  beginTick() {
    if (this.inTick) {
      throw new Error('Tick already started');
    }
    this.inTick = true;
    this.committed = false;
  }

  commitBatch(batch) {
    if (!this.inTick) {
      throw new Error('Tick not started');
    }
    if (this.committed) {
      throw new Error('Tick already committed');
    }

    this.dom.runMutating(() => applyPatchBatch(this.dom, batch));
    this.committed = true;
    this.inTick = false;
    return this.dom.serialize();
  }

  snapshot() {
    return this.dom.serialize();
  }
}

export function createRunner() {
  return new HostRunner();
}

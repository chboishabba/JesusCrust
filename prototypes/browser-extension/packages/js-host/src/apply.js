import { DomModel } from './dom.js';

export function applyPatchBatch(dom, batch) {
  if (!(dom instanceof DomModel)) {
    throw new Error('applyPatchBatch expects a DomModel');
  }

  if (!batch || !Array.isArray(batch.ops)) {
    throw new Error('Invalid patch batch');
  }

  for (const op of batch.ops) {
    switch (op.kind) {
      case 'EnsureNode': {
        dom.ensureNode(op.nodeId, op.tag);
        break;
      }
      case 'SetText': {
        dom.setText(op.nodeId, op.value);
        break;
      }
      case 'SetAttr': {
        dom.setAttr(op.nodeId, op.name, op.value);
        break;
      }
      case 'AppendChild': {
        dom.appendChild(op.parentId, op.childId);
        break;
      }
      case 'Remove': {
        dom.removeNode(op.nodeId);
        break;
      }
      default:
        throw new Error(`Unknown patch op: ${op.kind}`);
    }
  }
}

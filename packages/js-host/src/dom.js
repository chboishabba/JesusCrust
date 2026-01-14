class DomNode {
  constructor(id, tag) {
    this.id = id;
    this.tag = tag;
    this.text = '';
    this.attrs = new Map();
    this.children = [];
    this.parent = null;
  }
}

export class DomModel {
  constructor() {
    this.nodes = new Map();
    this.mutationAllowed = false;
  }

  static fromSerialized(serialized) {
    const data = JSON.parse(serialized);
    const model = new DomModel();
    for (const item of data) {
      const node = new DomNode(item.id, item.tag);
      node.text = item.text;
      for (const [name, value] of item.attrs) {
        node.attrs.set(name, value);
      }
      node.children = [...item.children];
      model.nodes.set(node.id, node);
    }

    for (const item of data) {
      if (item.parent !== null) {
        const node = model.nodes.get(item.id);
        const parent = model.nodes.get(item.parent);
        node.parent = parent;
      }
    }

    return model;
  }

  runMutating(fn) {
    const previous = this.mutationAllowed;
    this.mutationAllowed = true;
    try {
      return fn();
    } finally {
      this.mutationAllowed = previous;
    }
  }

  assertMutationAllowed() {
    if (!this.mutationAllowed) {
      throw new Error('Mutation outside commitBatch');
    }
  }

  getNode(id) {
    const node = this.nodes.get(id);
    if (!node) {
      throw new Error(`Unknown node ${id}`);
    }
    return node;
  }

  ensureNode(id, tag) {
    this.assertMutationAllowed();
    if (this.nodes.has(id)) {
      return this.nodes.get(id);
    }
    const node = new DomNode(id, tag);
    this.nodes.set(id, node);
    return node;
  }

  setText(id, value) {
    this.assertMutationAllowed();
    const node = this.getNode(id);
    node.text = value;
  }

  setAttr(id, name, value) {
    this.assertMutationAllowed();
    const node = this.getNode(id);
    node.attrs.set(name, value);
  }

  appendChild(parentId, childId) {
    this.assertMutationAllowed();
    const parent = this.getNode(parentId);
    const child = this.getNode(childId);

    if (child.parent) {
      const siblings = child.parent.children;
      const idx = siblings.indexOf(childId);
      if (idx >= 0) {
        siblings.splice(idx, 1);
      }
    }

    child.parent = parent;
    parent.children.push(childId);
  }

  removeNode(id) {
    this.assertMutationAllowed();
    const node = this.nodes.get(id);
    if (!node) {
      return;
    }

    if (node.parent) {
      const siblings = node.parent.children;
      const idx = siblings.indexOf(id);
      if (idx >= 0) {
        siblings.splice(idx, 1);
      }
    }

    // Remove descendants first to avoid dangling references.
    for (const childId of [...node.children]) {
      this.removeNode(childId);
    }

    this.nodes.delete(id);
  }

  serialize() {
    const serializeAttrs = (attrs) => {
      const entries = Array.from(attrs.entries()).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      return entries.map(([name, value]) => [name, value]);
    };

    const nodes = Array.from(this.nodes.values())
      .sort((a, b) => a.id - b.id)
      .map((node) => ({
        id: node.id,
        tag: node.tag,
        text: node.text,
        attrs: serializeAttrs(node.attrs),
        children: [...node.children],
        parent: node.parent ? node.parent.id : null,
      }));

    return JSON.stringify(nodes);
  }
}

export function createDomModel() {
  return new DomModel();
}

export function createDomModelFromSerialized(serialized) {
  return DomModel.fromSerialized(serialized);
}

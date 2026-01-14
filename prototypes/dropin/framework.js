export function h(type, props, ...children) {
  return { type, props: props ?? {}, children };
}

export function createView(label, color) {
  return h(
    'div',
    { class: 'app' },
    h('span', { class: 'label', style: `color: ${color}` }, label),
    h('button', { class: 'update-button', onClick: () => console.log('button clicked') }, 'Update')
  );
}

export function renderView(host, view) {
  const processed = { nextId: 2 };

  function applyProps(nodeId, node) {
    for (const [key, value] of Object.entries(node.props)) {
      if (key.startsWith('on') && typeof value === 'function') {
        const eventType = key.slice(2).toLowerCase();
        host.addEventListener(nodeId, eventType, value);
      } else {
        host.setAttr(nodeId, key, value);
      }
    }
  }

  function patchChildren(parentId, node) {
    for (const child of node.children) {
      if (typeof child === 'object') {
        const childId = processed.nextId++;
        host.ensureNode(childId, child.type);
        applyProps(childId, child);
        const textChildren = child.children.filter((c) => typeof c === 'string');
        if (textChildren.length > 0) {
          host.setText(childId, textChildren.join(''));
        }
        host.appendChild(parentId, childId);
        patchChildren(childId, child);
      }
    }
  }

  const rootId = 1;
  host.ensureNode(rootId, view.type);
  applyProps(rootId, view);
  const textChildren = view.children.filter((child) => typeof child === 'string');
  if (textChildren.length > 0) {
    host.setText(rootId, textChildren.join(''));
  }
  patchChildren(rootId, view);
}

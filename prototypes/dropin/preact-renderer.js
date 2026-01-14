function flattenChildren(children) {
  if (children == null) {
    return [];
  }
  if (Array.isArray(children)) {
    return children.flatMap(flattenChildren);
  }
  return [children];
}

function normalizeChildren(children) {
  return flattenChildren(children)
    .map((child) => normalizeVNode(child))
    .filter((child) => child !== null && child !== undefined);
}

function normalizeVNode(vnode) {
  if (vnode == null) {
    return null;
  }
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return String(vnode);
  }
  if (typeof vnode.type === 'function') {
    const props = { ...(vnode.props ?? {}) };
    props.children = flattenChildren(vnode.children ?? vnode.props?.children);
    return normalizeVNode(vnode.type(props));
  }
  const resolvedChildren = normalizeChildren(vnode.children ?? vnode.props?.children);
  return {
    type: vnode.type,
    props: vnode.props ?? {},
    children: resolvedChildren,
    key: vnode.key ?? vnode.props?.key,
  };
}

function applyProps(host, nodeId, props) {
  for (const [key, value] of Object.entries(props)) {
    if (key === 'key' || key === 'children') {
      continue;
    }
    if (key.startsWith('on') && typeof value === 'function') {
      const eventType = key.slice(2).toLowerCase();
      host.addEventListener(nodeId, eventType, value);
    } else {
      host.setAttr(nodeId, key, String(value));
    }
  }
}

function renderElement(host, vnode, parentId, path, index = 0, options = {}, nodeMap) {
  const resolved = normalizeVNode(vnode);
  if (resolved == null) {
    return null;
  }
  if (typeof resolved === 'string') {
    host.setText(parentId, resolved);
    return null;
  }

  const explicitKey = resolved.key ?? resolved.props?.key;
  const nodeKey = options.forceBaseKey
    ? path
    : `${path}:${explicitKey ?? index}`;
  const nodeId = host.ensureNodeWithKey(nodeKey, resolved.type);
  if (nodeMap) {
    nodeMap.set(nodeKey, nodeId);
  }
  applyProps(host, nodeId, resolved.props);
  host.appendChild(parentId, nodeId);

  const textChildren = resolved.children.filter((child) => typeof child === 'string');
  if (textChildren.length > 0) {
    host.setText(nodeId, textChildren.join(''));
  }

  resolved.children
    .filter((child) => typeof child !== 'string')
    .forEach((child, childIndex) => {
      renderElement(host, child, nodeId, nodeKey, childIndex, {}, nodeMap);
    });

  return nodeId;
}

export function renderPreactTree(host, vnode) {
  const containerId = host.ensureNodeWithKey('root', 'div');
  const nodeMap = new Map();
  renderElement(host, vnode, containerId, 'preact-root', 0, { forceBaseKey: true }, nodeMap);
  return nodeMap;
}

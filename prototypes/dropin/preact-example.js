import { h } from 'preact';
import { createDropInHost } from './adapter.js';
import { renderPreactTree } from './preact-renderer.js';

const host = createDropInHost();

const App = ({ label, color }) =>
  h(
    'div',
    { class: 'preact-app', style: `border: 1px solid ${color}; padding: 8px;` },
    h('span', { class: 'label', style: `color: ${color}; font-weight: bold;` }, label),
    h(
      'button',
      {
        class: 'action-button',
        key: 'preact-button',
        onClick: (event) => {
          console.log('Preact button handler fired', event.detail);
        },
      },
      'Trigger event'
    )
  );

function tick(label, color) {
  host.beginTick();
  const nodes = renderPreactTree(host, h(App, { label, color }));
  const { serialized, fingerprint } = host.commit();
  console.log('Preact render serialized:', serialized);
  console.log('Preact fingerprint:', fingerprint.toString());

  const buttonId = nodes.get('preact-root:preact-button');
  host.dispatchEvent(buttonId, 'click', { label });
}

tick('Preact-style render', '#007acc');
tick('Preact second frame', '#ff8800');

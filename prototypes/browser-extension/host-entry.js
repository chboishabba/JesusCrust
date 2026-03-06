(() => {
  const CHANNEL = 'verso-guarded-host';
  const pending = new Map();
  let nextRequestId = 1;

  const handlePageResponse = (event) => {
    if (event.source !== window) {
      return;
    }
    const message = event.data;
    if (!message || message.channel !== CHANNEL || message.target !== 'content') {
      return;
    }
    const resolver = pending.get(message.requestId);
    if (!resolver) {
      return;
    }
    pending.delete(message.requestId);
    resolver(message);
  };

  window.addEventListener('message', handlePageResponse);

  if (chrome?.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || message.channel !== CHANNEL) {
        return;
      }
      const requestId = nextRequestId++;
      pending.set(requestId, (reply) => {
        if (reply.ok) {
          sendResponse({ ok: true, payload: reply.payload });
        } else {
          sendResponse({ ok: false, error: reply.error });
        }
      });
      window.postMessage(
        {
          channel: CHANNEL,
          target: 'page',
          requestId,
          type: message.type,
          payload: message.payload ?? null,
        },
        '*'
      );
      return true;
    });
  }

  const injectPageHost = () => {
    if (typeof document === 'undefined') {
      return;
    }
    if (document.querySelector('script[data-verso-host="page"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('page-host.js');
    script.type = 'module';
    script.dataset.versoHost = 'page';
    script.onload = () => {
      script.remove();
    };
    (document.head || document.documentElement || document.body || document).appendChild(script);
  };

  injectPageHost();
})();

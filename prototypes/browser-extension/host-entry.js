(() => {
  const loadGuardedHost = async () => {
    try {
      const { startGuardedBrowserHost } = await import('./host.js');
      startGuardedBrowserHost();
    } catch (error) {
      console.error('Failed to initialize GuardedBrowserHost', error);
    }
  };

  loadGuardedHost();
})();

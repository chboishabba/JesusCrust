host.effect("setText", "start");
Promise.resolve().then(() => host.effect("setText", "micro1"));
Promise.resolve().then(() => host.effect("setText", "micro2"));

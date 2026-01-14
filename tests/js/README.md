# Harness JS Fixtures

Fixtures under `tests/js/` are executed by the Rust harness via QuickJS.

## Host API

The harness exposes a minimal `host` object:

- `host.begin()` — start a transactional tick.
- `host.effect(op, ...args)` — record an effect intent.
- `host.commit()` — commit buffered effects.
- `host.rollback()` — discard buffered effects.
- `host.enqueue_microtask(fn)` — schedule a function in the QuickJS job queue.

Use these calls explicitly when testing manual transactions. For tick-based tests,
the harness wraps `begin` → fixture eval → microtasks → `commit` automatically.

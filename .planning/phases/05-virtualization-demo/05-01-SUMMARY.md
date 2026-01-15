# Virtualization Demo Summary

- Added `prototypes/dropin/virtualizer.js` plus `prototypes/dropin/virtualization-test.js` to show how a sliding window can feed the adapter while still producing deterministic, single-commit batches and stable NodeIds.
- Documented virtualization in `docs/dropin_overview.md` so the contract explains how virtualized workloads are just another renderer-respected scenario.
- Verified the full drop-in suite (`npm test`) passes, including the new virtualization demonstration and diagnostic tests.

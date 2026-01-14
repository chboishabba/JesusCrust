JavaCrust context sync (local)

- Source context file: PROJECT_CONTEXT.md (checked via rg; lines 3329-3343 include the latest assistant prompt).
- Conversation target: "JavaCrust Project Idea" (conversation_id 695485d0-6c64-8320-8cb9-3c4aff451994).
- Local sqlite status: conversations row exists, but messages table has no rows for this conversation (cached_message_count=0).
- re-gpt status: `--view` prompts for a fresh __Secure-next-auth.session-token; cached token rejected.
- Missing local references: no config.ini or references/context-sources.md found in this repo.
- Planning refresh (2026-01-14): created `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/config.json`, `.planning/phases/01-execution-harness/01-01-PLAN.md`, and `.planning/phases/01-execution-harness/DISCOVERY.md` (QuickJS embedding discovery, low confidence pending doc verification).
- Phase 1 roadmap now has a single plan; deliverables map to Day 1/2/3 tasks in `01-01-PLAN.md`, which now references DISCOVERY.md in its context.
- Phase 1 execution (2026-01-14): added Rust workspace + harness crate with QuickJS runner, fake DOM/effect log + transactional rollback on forbidden ops, macrotask tick runner with microtask draining, and deterministic replay tests (see `crates/harness/` and `tests/js/`).
- Phase 2 planning (2026-01-14): created `.planning/phases/02-rust-wasm-core/DISCOVERY.md` plus `02-01-PLAN.md` (core crate + graph + store/selector) and `02-02-PLAN.md` (patch ops + scheduler + engine integration).
- Phase 2 execution (2026-01-14): completed `02-01-PLAN.md` with `crust_core` crate scaffold, deterministic dependency graph, and selector-aware store with tests.
- Phase 2 execution (2026-01-14): completed `02-02-PLAN.md` with patch ops, effect queue, scheduler enforcing single-commit ticks, and engine batching store updates into patch batches.
- Phase 3 context (2026-01-14): captured JS host integration vision in `.planning/phases/03-js-host-integration/03-CONTEXT.md`.

# Repository Guidelines

## Project Structure & Module Organization

- `README.md` provides the high-level vision and architecture sketch.
- `PROJECT_CONTEXT.md` captures detailed design notes, deliverables, and research.
- `.planning/` stores planning artifacts and milestones.
- There is no `src/` or test tree yet; add them when implementation starts (e.g., `crates/` for Rust, `packages/` for JS tooling).

## Build, Test, and Development Commands

No build or test commands are defined yet because the repository is still in the planning phase. Once implementation starts, document commands here (examples to align on):

- `cargo build` — build the Rust core.
- `cargo test` — run Rust unit/integration tests.
- `npm test` — run JS/WASM bridge tests.

## Coding Style & Naming Conventions

Style rules are not established yet. Use these defaults until a formatter is added:

- Rust: 4-space indentation, snake_case for modules/functions, CamelCase for types; plan to use `rustfmt` once a `Cargo.toml` exists.
- JavaScript/TypeScript (if added): 2-space indentation, camelCase for functions/variables, PascalCase for classes; plan to add `prettier`/`eslint`.
- File naming: prefer lowercase with underscores for Rust files (e.g., `effect_log.rs`) and kebab-case for JS packages (e.g., `wasm-bridge/`).

## Testing Guidelines

Testing frameworks are not selected yet. When tests are added:

- Place Rust tests in `src/` as module tests or under `tests/` for integration.
- Name tests after behavior (e.g., `commit_coalesces_microtasks`).
- Document expected coverage goals and how to run the suite.

## Commit & Pull Request Guidelines

Recent commits use short, imperative messages (e.g., “Create PROJECT_CONTEXT.md”, “Update PROJECT_CONTEXT.md”). Follow this pattern:

- Use concise, present-tense summaries.
- Keep each commit focused on one change.

For pull requests:

- Provide a clear summary, motivation, and any open questions.
- Link related planning artifacts in `.planning/` when relevant.
- Include repro steps or screenshots if behavior or docs change.

## Security & Configuration Tips

No runtime configuration exists yet. When adding configuration, document defaults and provide a minimal example (e.g., `config/example.toml`).

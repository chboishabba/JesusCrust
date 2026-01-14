mod effect_log;
mod fake_dom;
mod fixture;
mod replay;
mod runner;
mod transaction;

pub use fixture::fixture_path;
pub use replay::replay_effects;
pub use runner::{ExecutionResult, HarnessRunner};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EffectRecord {
    pub op: String,
    pub args: Vec<String>,
}

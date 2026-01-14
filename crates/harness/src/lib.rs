mod fixture;
mod runner;

pub use fixture::fixture_path;
pub use runner::{ExecutionResult, HarnessRunner};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EffectRecord {
    pub op: String,
    pub args: Vec<String>,
}

use crate::patch::{PatchBatch, PatchOp};

#[derive(Debug, Default, Clone)]
pub struct EffectQueue {
    pending: Vec<PatchOp>,
}

impl EffectQueue {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn push(&mut self, op: PatchOp) {
        self.pending.push(op);
    }

    pub fn commit(&mut self) -> PatchBatch {
        self.pending.drain(..).collect()
    }

    pub fn pending(&self) -> &[PatchOp] {
        &self.pending
    }
}

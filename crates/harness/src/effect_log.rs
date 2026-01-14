use crate::EffectRecord;

#[derive(Debug, Default, Clone)]
pub struct EffectLog {
    pending: Vec<EffectRecord>,
    committed: Vec<EffectRecord>,
}

impl EffectLog {
    pub fn record(&mut self, effect: EffectRecord) {
        self.pending.push(effect);
    }

    pub fn commit(&mut self) -> usize {
        let count = self.pending.len();
        self.committed.extend(self.pending.drain(..));
        count
    }

    pub fn rollback(&mut self) {
        self.pending.clear();
    }

    pub fn committed(&self) -> &[EffectRecord] {
        &self.committed
    }

    pub fn pending(&self) -> &[EffectRecord] {
        &self.pending
    }
}

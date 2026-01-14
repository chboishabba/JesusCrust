use crate::effect_log::EffectLog;
use crate::EffectRecord;

#[derive(Debug, Default, Clone)]
pub struct FakeDom {
    log: EffectLog,
}

impl FakeDom {
    pub fn record_effect(&mut self, effect: EffectRecord) {
        self.log.record(effect);
    }

    pub fn commit(&mut self) -> usize {
        self.log.commit()
    }

    pub fn rollback(&mut self) {
        self.log.rollback();
    }

    pub fn committed_effects(&self) -> &[EffectRecord] {
        self.log.committed()
    }

    pub fn pending_effects(&self) -> &[EffectRecord] {
        self.log.pending()
    }
}

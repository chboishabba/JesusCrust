use crate::EffectRecord;

pub fn replay_effects(effects: &[EffectRecord]) -> Vec<EffectRecord> {
    effects.to_vec()
}

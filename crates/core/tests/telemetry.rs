#![cfg(feature = "phase6-telemetry")]

use std::time::Duration;

use crust_core::{Engine, NodeId, TickResult};

#[test]
fn telemetry_records_selector_metrics() {
    let mut engine = Engine::new();
    engine.begin_tick().unwrap();

    engine
        .telemetry_mut()
        .record_selector_invalidation(Duration::from_millis(2), 1, 3, 0);
    engine.set_value(NodeId::new(1), "telemetry").unwrap();

    let batch = engine.commit().unwrap();
    assert_eq!(batch.len(), 1);

    let ticks = engine.telemetry().snapshot();
    assert_eq!(ticks.len(), 1);

    let tick = &ticks[0];
    assert_eq!(tick.result, TickResult::Commit);
    assert_eq!(tick.work.selectors_evaluated, 1);
    assert_eq!(tick.work.elements_invalidated, 3);
    assert_eq!(tick.work.restyled_elements, 0);
    assert_eq!(tick.work.dom_mutations, 1);
    assert_eq!(tick.work.patch_ops, 1);
    assert_eq!(tick.durations.selector_invalidation_ms, 2.0);
    assert_eq!(tick.durations.style_recalc_ms, 2.0);

    let samples = engine.telemetry().phase6_snapshot();
    assert_eq!(samples.len(), 1);
    let sample = &samples[0];
    assert_eq!(sample.tick_id, tick.tick_id);
    assert_eq!(sample.selector_invalidation_ms, 2.0);
    assert_eq!(sample.elements_invalidated, 3);
    assert_eq!(sample.patch_ops, 1);
}

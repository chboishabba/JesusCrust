#![cfg(feature = "phase6-telemetry")]

use std::time::Duration;

use crust_core::{Engine, NodeId, TickResult};

#[test]
fn telemetry_records_selector_metrics() {
    let mut engine = Engine::new();
    engine.begin_tick().unwrap();

    engine
        .telemetry_mut()
        .record_selector_evaluation(Duration::from_millis(2), 3);
    engine.set_value(NodeId::new(1), "telemetry").unwrap();

    let batch = engine.commit().unwrap();
    assert_eq!(batch.len(), 1);

    let ticks = engine.telemetry().snapshot();
    assert_eq!(ticks.len(), 1);

    let tick = &ticks[0];
    assert_eq!(tick.result, TickResult::Commit);
    assert_eq!(tick.work.selectors_evaluated, 1);
    assert_eq!(tick.work.elements_invalidated, 3);
    assert_eq!(tick.work.dom_mutations, 1);
}

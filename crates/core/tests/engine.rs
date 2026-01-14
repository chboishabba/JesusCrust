use crust_core::{Engine, NodeId, PatchOp, SchedulerError};

#[test]
fn engine_emits_patch_batch_per_tick() {
    let mut engine = Engine::new();

    engine.begin_tick().unwrap();
    engine.set_value(NodeId::new(1), "hello").unwrap();
    engine.set_value(NodeId::new(2), "world").unwrap();

    let batch = engine.commit().unwrap();

    assert_eq!(
        batch,
        vec![
            PatchOp::SetText {
                node: NodeId::new(1),
                text: "hello".to_string(),
            },
            PatchOp::SetText {
                node: NodeId::new(2),
                text: "world".to_string(),
            },
        ]
    );
}

#[test]
fn engine_rejects_commit_without_tick() {
    let mut engine = Engine::new();

    let result = engine.commit();

    assert!(matches!(result, Err(SchedulerError::TickNotStarted)));
}

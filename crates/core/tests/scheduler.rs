use crust_core::{NodeId, PatchOp, Scheduler, SchedulerError};

#[test]
fn scheduler_coalesces_ops_into_single_batch() {
    let mut scheduler = Scheduler::new();
    scheduler.begin_tick().expect("tick should start");
    scheduler
        .enqueue_op(PatchOp::SetText {
            node: NodeId::new(1),
            text: "first".to_string(),
        })
        .expect("enqueue should work");
    scheduler
        .enqueue_op(PatchOp::Remove {
            node: NodeId::new(2),
        })
        .expect("enqueue should work");

    let batch = scheduler.commit_tick().expect("commit should work");

    assert_eq!(batch.len(), 2);
}

#[test]
fn scheduler_requires_begin_before_commit() {
    let mut scheduler = Scheduler::new();

    let result = scheduler.commit_tick();

    assert!(matches!(result, Err(SchedulerError::TickNotStarted)));
}

#[test]
fn scheduler_resets_for_next_tick() {
    let mut scheduler = Scheduler::new();

    scheduler.begin_tick().unwrap();
    scheduler
        .enqueue_op(PatchOp::Remove {
            node: NodeId::new(3),
        })
        .unwrap();
    scheduler.commit_tick().unwrap();

    scheduler.begin_tick().unwrap();
    scheduler
        .enqueue_op(PatchOp::SetText {
            node: NodeId::new(4),
            text: "next".to_string(),
        })
        .unwrap();

    let batch = scheduler.commit_tick().unwrap();
    assert_eq!(batch.len(), 1);
}

use crust_core::{EffectQueue, NodeId, PatchOp};

#[test]
fn effect_queue_preserves_order_and_clears() {
    let mut queue = EffectQueue::new();
    let first = PatchOp::SetText {
        node: NodeId::new(1),
        text: "alpha".to_string(),
    };
    let second = PatchOp::Remove {
        node: NodeId::new(2),
    };

    queue.push(first.clone());
    queue.push(second.clone());

    let batch = queue.commit();

    assert_eq!(batch, vec![first, second]);
    assert!(queue.pending().is_empty());
}

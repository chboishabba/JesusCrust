use crust_core::{DependencyGraph, NodeId, Selector, Store};

#[test]
fn selector_reads_register_dependencies() {
    let mut store = Store::new();
    let mut graph = DependencyGraph::new();

    let value_node = NodeId::new(1);
    let selector_node = NodeId::new(2);
    store.set_value(value_node, "alpha");

    let selector = Selector::new(selector_node, |ctx| {
        ctx.read(value_node).unwrap_or_default()
    });

    let output = selector.evaluate(&store, &mut graph);
    assert_eq!(output, "alpha");
    assert_eq!(graph.dependents_of(value_node), vec![selector_node]);
}

#[test]
fn selector_reads_do_not_duplicate_edges() {
    let mut store = Store::new();
    let mut graph = DependencyGraph::new();

    let value_node = NodeId::new(1);
    let selector_node = NodeId::new(2);
    store.set_value(value_node, "alpha");

    let selector = Selector::new(selector_node, |ctx| {
        let _ = ctx.read(value_node);
        ctx.read(value_node).unwrap_or_default()
    });

    selector.evaluate(&store, &mut graph);
    selector.evaluate(&store, &mut graph);

    assert_eq!(graph.dependents_of(value_node), vec![selector_node]);
}

#[test]
fn selector_recompute_keeps_dependency_order() {
    let mut store = Store::new();
    let mut graph = DependencyGraph::new();

    let value_node = NodeId::new(1);
    store.set_value(value_node, "alpha");

    let selector_a = Selector::new(NodeId::new(3), |ctx| {
        ctx.read(value_node).unwrap_or_default()
    });
    let selector_b = Selector::new(NodeId::new(2), |ctx| {
        ctx.read(value_node).unwrap_or_default()
    });

    selector_a.evaluate(&store, &mut graph);
    selector_b.evaluate(&store, &mut graph);

    let first = graph.dependents_of(value_node);
    assert_eq!(first, vec![NodeId::new(2), NodeId::new(3)]);

    store.set_value(value_node, "beta");
    selector_b.evaluate(&store, &mut graph);
    selector_a.evaluate(&store, &mut graph);

    let second = graph.dependents_of(value_node);
    assert_eq!(second, first);
}

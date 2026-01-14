use crust_core::{DependencyGraph, NodeId};

#[test]
fn dependents_are_deterministic() {
    let mut graph_a = DependencyGraph::new();
    graph_a.add_edge(NodeId::new(1), NodeId::new(3));
    graph_a.add_edge(NodeId::new(1), NodeId::new(2));
    graph_a.add_edge(NodeId::new(1), NodeId::new(4));

    let mut graph_b = DependencyGraph::new();
    graph_b.add_edge(NodeId::new(1), NodeId::new(4));
    graph_b.add_edge(NodeId::new(1), NodeId::new(2));
    graph_b.add_edge(NodeId::new(1), NodeId::new(3));

    let expected = vec![NodeId::new(2), NodeId::new(3), NodeId::new(4)];
    assert_eq!(graph_a.dependents_of(NodeId::new(1)), expected);
    assert_eq!(graph_b.dependents_of(NodeId::new(1)), expected);
}

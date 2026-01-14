use std::collections::{BTreeMap, BTreeSet};

use crate::NodeId;

#[derive(Debug, Default, Clone)]
pub struct DependencyGraph {
    adjacency: BTreeMap<NodeId, BTreeSet<NodeId>>,
}

impl DependencyGraph {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn add_node(&mut self, node: NodeId) {
        self.adjacency.entry(node).or_default();
    }

    pub fn add_edge(&mut self, source: NodeId, dependent: NodeId) {
        self.add_node(source);
        self.add_node(dependent);
        if let Some(dependents) = self.adjacency.get_mut(&source) {
            dependents.insert(dependent);
        }
    }

    pub fn dependents_of(&self, node: NodeId) -> Vec<NodeId> {
        self.adjacency
            .get(&node)
            .map(|set| set.iter().copied().collect())
            .unwrap_or_default()
    }
}

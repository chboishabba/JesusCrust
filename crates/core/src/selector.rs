use crate::{DependencyGraph, NodeId, Store};

pub struct SelectorContext<'a> {
    store: &'a Store,
    graph: &'a mut DependencyGraph,
    selector_id: NodeId,
}

impl<'a> SelectorContext<'a> {
    pub fn read(&mut self, node: NodeId) -> Option<String> {
        self.graph.add_edge(node, self.selector_id);
        self.store.get_value(node).cloned()
    }
}

pub struct Selector<F>
where
    F: Fn(&mut SelectorContext<'_>) -> String,
{
    id: NodeId,
    compute: F,
}

impl<F> Selector<F>
where
    F: Fn(&mut SelectorContext<'_>) -> String,
{
    pub fn new(id: NodeId, compute: F) -> Self {
        Self { id, compute }
    }

    pub fn id(&self) -> NodeId {
        self.id
    }

    pub fn evaluate(&self, store: &Store, graph: &mut DependencyGraph) -> String {
        let mut ctx = SelectorContext {
            store,
            graph,
            selector_id: self.id,
        };
        (self.compute)(&mut ctx)
    }
}

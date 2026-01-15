use crate::telemetry::TelemetryRecorder;
use crate::{DependencyGraph, NodeId, Store};

#[cfg(feature = "phase6-telemetry")]
use std::time::Instant;

pub struct SelectorContext<'a> {
    store: &'a Store,
    graph: &'a mut DependencyGraph,
    selector_id: NodeId,
    read_count: usize,
}

impl<'a> SelectorContext<'a> {
    pub fn new(store: &'a Store, graph: &'a mut DependencyGraph, selector_id: NodeId) -> Self {
        Self {
            store,
            graph,
            selector_id,
            read_count: 0,
        }
    }

    pub fn read(&mut self, node: NodeId) -> Option<String> {
        self.graph.add_edge(node, self.selector_id);
        self.read_count += 1;
        self.store.get_value(node).cloned()
    }

    pub fn reads(&self) -> usize {
        self.read_count
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
        self.evaluate_with_recorder(store, graph, None)
    }

    pub fn evaluate_with_recorder(
        &self,
        store: &Store,
        graph: &mut DependencyGraph,
        #[cfg_attr(not(feature = "phase6-telemetry"), allow(unused_variables))] recorder: Option<
            &mut TelemetryRecorder,
        >,
    ) -> String {
        let mut ctx = SelectorContext::new(store, graph, self.id);
        #[cfg(feature = "phase6-telemetry")]
        let start = Instant::now();

        let output = (self.compute)(&mut ctx);

        #[cfg(feature = "phase6-telemetry")]
        if let Some(recorder) = recorder {
            recorder.record_selector_evaluation(start.elapsed(), ctx.reads());
        }

        output
    }
}

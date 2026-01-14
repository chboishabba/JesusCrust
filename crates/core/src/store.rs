use std::collections::HashMap;

use crate::NodeId;

#[derive(Debug, Default, Clone)]
pub struct Store {
    values: HashMap<NodeId, String>,
}

impl Store {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set_value<S: Into<String>>(&mut self, node: NodeId, value: S) {
        self.values.insert(node, value.into());
    }

    pub fn get_value(&self, node: NodeId) -> Option<&String> {
        self.values.get(&node)
    }
}

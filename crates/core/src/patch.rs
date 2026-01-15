use crate::NodeId;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum PatchOp {
    SetText {
        node: NodeId,
        text: String,
    },
    SetAttr {
        node: NodeId,
        name: String,
        value: String,
    },
    Insert {
        parent: NodeId,
        child: NodeId,
    },
    Remove {
        node: NodeId,
    },
}

pub type PatchBatch = Vec<PatchOp>;

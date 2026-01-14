use std::collections::HashSet;

use rquickjs::Error;

use crate::fake_dom::FakeDom;
use crate::EffectRecord;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CommitOutcome {
    Committed(usize),
    RolledBack,
}

#[derive(Debug, Default, Clone)]
pub struct Transaction {
    dom: FakeDom,
    forbidden_ops: HashSet<String>,
    in_transaction: bool,
    forbidden_hit: bool,
}

impl Transaction {
    pub fn new<I, S>(forbidden_ops: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        Self {
            dom: FakeDom::default(),
            forbidden_ops: forbidden_ops.into_iter().map(Into::into).collect(),
            in_transaction: false,
            forbidden_hit: false,
        }
    }

    pub fn begin(&mut self) -> Result<(), Error> {
        if self.in_transaction {
            return Err(Error::new_from_js_message(
                "host",
                "transaction",
                "begin called while in transaction",
            ));
        }
        self.in_transaction = true;
        self.forbidden_hit = false;
        Ok(())
    }

    pub fn record_effect(&mut self, effect: EffectRecord) -> Result<(), Error> {
        if !self.in_transaction {
            return Err(Error::new_from_js_message(
                "host",
                "transaction",
                "effect outside transaction",
            ));
        }
        if self.forbidden_ops.contains(&effect.op) {
            self.forbidden_hit = true;
        }
        self.dom.record_effect(effect);
        Ok(())
    }

    pub fn commit(&mut self) -> Result<CommitOutcome, Error> {
        if !self.in_transaction {
            return Err(Error::new_from_js_message(
                "host",
                "transaction",
                "commit without begin",
            ));
        }
        self.in_transaction = false;
        if self.forbidden_hit {
            self.dom.rollback();
            self.forbidden_hit = false;
            return Ok(CommitOutcome::RolledBack);
        }
        let count = self.dom.commit();
        Ok(CommitOutcome::Committed(count))
    }

    pub fn rollback(&mut self) -> Result<(), Error> {
        if !self.in_transaction {
            return Err(Error::new_from_js_message(
                "host",
                "transaction",
                "rollback without begin",
            ));
        }
        self.dom.rollback();
        self.in_transaction = false;
        self.forbidden_hit = false;
        Ok(())
    }

    pub fn committed_effects(&self) -> &[EffectRecord] {
        self.dom.committed_effects()
    }

    pub fn pending_effects(&self) -> &[EffectRecord] {
        self.dom.pending_effects()
    }
}

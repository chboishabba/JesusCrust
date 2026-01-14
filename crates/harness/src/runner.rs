use std::cell::RefCell;
use std::path::Path;
use std::rc::Rc;

use rquickjs::{Context, Ctx, Error, Object, Runtime};
use rquickjs::prelude::{Func, Rest};

use crate::transaction::{CommitOutcome, Transaction};
use crate::EffectRecord;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExecutionResult {
    pub committed_effects: Vec<EffectRecord>,
    pub pending_effects: Vec<EffectRecord>,
    pub commit_count: usize,
    pub rollback_count: usize,
}

struct RunnerState {
    transaction: Transaction,
    commit_count: usize,
    rollback_count: usize,
}

pub struct HarnessRunner {
    _runtime: Runtime,
    context: Context,
    state: Rc<RefCell<RunnerState>>,
}

impl HarnessRunner {
    pub fn new() -> Result<Self, Error> {
        Self::with_forbidden_ops(["forbidden_op"])
    }

    pub fn with_forbidden_ops<I, S>(ops: I) -> Result<Self, Error>
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        let runtime = Runtime::new()?;
        let context = Context::full(&runtime)?;
        let state = Rc::new(RefCell::new(RunnerState {
            transaction: Transaction::new(ops),
            commit_count: 0,
            rollback_count: 0,
        }));

        context.with(|ctx| register_host(ctx, Rc::clone(&state)))?;

        Ok(Self {
            _runtime: runtime,
            context,
            state,
        })
    }

    pub fn run_fixture<P: AsRef<Path>>(&mut self, path: P) -> Result<ExecutionResult, Error> {
        self.context.with(|ctx| ctx.eval_file::<(), _>(path.as_ref()))?;
        Ok(self.snapshot())
    }

    fn snapshot(&self) -> ExecutionResult {
        let state = self.state.borrow();
        ExecutionResult {
            committed_effects: state.transaction.committed_effects().to_vec(),
            pending_effects: state.transaction.pending_effects().to_vec(),
            commit_count: state.commit_count,
            rollback_count: state.rollback_count,
        }
    }
}

fn register_host<'js>(ctx: Ctx<'js>, state: Rc<RefCell<RunnerState>>) -> Result<(), Error> {
    let host = Object::new(ctx.clone())?;

    let begin_state = Rc::clone(&state);
    host.set(
        "begin",
        Func::from(move || -> Result<(), Error> {
            begin_state.borrow_mut().transaction.begin()?;
            Ok(())
        }),
    )?;

    let commit_state = Rc::clone(&state);
    host.set(
        "commit",
        Func::from(move || -> Result<(), Error> {
            let mut state = commit_state.borrow_mut();
            match state.transaction.commit()? {
                CommitOutcome::Committed(_) => state.commit_count += 1,
                CommitOutcome::RolledBack => state.rollback_count += 1,
            }
            Ok(())
        }),
    )?;

    let rollback_state = Rc::clone(&state);
    host.set(
        "rollback",
        Func::from(move || -> Result<(), Error> {
            let mut state = rollback_state.borrow_mut();
            state.transaction.rollback()?;
            state.rollback_count += 1;
            Ok(())
        }),
    )?;

    let effect_state = Rc::clone(&state);
    host.set(
        "effect",
        Func::from(move |op: String, args: Rest<String>| -> Result<(), Error> {
            let effect = EffectRecord { op, args: args.0 };
            effect_state.borrow_mut().transaction.record_effect(effect)
        }),
    )?;

    ctx.globals().set("host", host)?;

    Ok(())
}

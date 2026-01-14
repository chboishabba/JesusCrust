use std::cell::RefCell;
use std::path::Path;
use std::rc::Rc;

use rquickjs::{Context, Ctx, Error, Object, Runtime};
use rquickjs::prelude::{Func, Rest};

use crate::EffectRecord;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExecutionResult {
    pub effects: Vec<EffectRecord>,
    pub began: bool,
    pub committed: bool,
    pub rolled_back: bool,
}

#[derive(Default)]
struct RunnerState {
    effects: Vec<EffectRecord>,
    in_transaction: bool,
    committed: bool,
    rolled_back: bool,
}

pub struct HarnessRunner {
    _runtime: Runtime,
    context: Context,
    state: Rc<RefCell<RunnerState>>,
}

impl HarnessRunner {
    pub fn new() -> Result<Self, Error> {
        let runtime = Runtime::new()?;
        let context = Context::full(&runtime)?;
        let state = Rc::new(RefCell::new(RunnerState::default()));

        context.with(|ctx| register_host(ctx, Rc::clone(&state)))?;

        Ok(Self {
            _runtime: runtime,
            context,
            state,
        })
    }

    pub fn run_fixture<P: AsRef<Path>>(&mut self, path: P) -> Result<ExecutionResult, Error> {
        self.context.with(|ctx| ctx.eval_file::<(), _>(path.as_ref()))?;

        let state = self.state.borrow();
        Ok(ExecutionResult {
            effects: state.effects.clone(),
            began: state.in_transaction,
            committed: state.committed,
            rolled_back: state.rolled_back,
        })
    }
}

fn register_host<'js>(ctx: Ctx<'js>, state: Rc<RefCell<RunnerState>>) -> Result<(), Error> {
    let host = Object::new(ctx.clone())?;

    let begin_state = Rc::clone(&state);
    host.set(
        "begin",
        Func::from(move || -> Result<(), Error> {
            let mut state = begin_state.borrow_mut();
            state.in_transaction = true;
            state.committed = false;
            state.rolled_back = false;
            Ok(())
        }),
    )?;

    let commit_state = Rc::clone(&state);
    host.set(
        "commit",
        Func::from(move || -> Result<(), Error> {
            let mut state = commit_state.borrow_mut();
            if !state.in_transaction {
                return Err(Error::new_from_js_message(
                    "host",
                    "runner",
                    "commit without begin",
                ));
            }
            state.in_transaction = false;
            state.committed = true;
            Ok(())
        }),
    )?;

    let rollback_state = Rc::clone(&state);
    host.set(
        "rollback",
        Func::from(move || -> Result<(), Error> {
            let mut state = rollback_state.borrow_mut();
            if !state.in_transaction {
                return Err(Error::new_from_js_message(
                    "host",
                    "runner",
                    "rollback without begin",
                ));
            }
            state.effects.clear();
            state.in_transaction = false;
            state.rolled_back = true;
            Ok(())
        }),
    )?;

    let effect_state = Rc::clone(&state);
    host.set(
        "effect",
        Func::from(move |op: String, args: Rest<String>| -> Result<(), Error> {
            let mut state = effect_state.borrow_mut();
            if !state.in_transaction {
                return Err(Error::new_from_js_message(
                    "host",
                    "runner",
                    "effect outside transaction",
                ));
            }
            state.effects.push(EffectRecord { op, args: args.0 });
            Ok(())
        }),
    )?;

    ctx.globals().set("host", host)?;

    Ok(())
}

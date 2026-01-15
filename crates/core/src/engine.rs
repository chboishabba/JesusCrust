use crate::patch::{PatchBatch, PatchOp};
use crate::telemetry::{TelemetryRecorder, TickResult};
use crate::{NodeId, Scheduler, SchedulerError, Store};

#[derive(Debug)]
pub struct Engine {
    store: Store,
    scheduler: Scheduler,
    telemetry: TelemetryRecorder,
}

impl Default for Engine {
    fn default() -> Self {
        Self {
            store: Store::new(),
            scheduler: Scheduler::new(),
            telemetry: TelemetryRecorder::new(),
        }
    }
}

impl Engine {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn begin_tick(&mut self) -> Result<(), SchedulerError> {
        self.scheduler.begin_tick()?;
        self.telemetry.begin_tick();
        Ok(())
    }

    pub fn set_value<S: Into<String>>(
        &mut self,
        node: NodeId,
        value: S,
    ) -> Result<(), SchedulerError> {
        let value = value.into();
        self.store.set_value(node, value.clone());
        self.scheduler
            .enqueue_op(PatchOp::SetText { node, text: value })
    }

    pub fn commit(&mut self) -> Result<PatchBatch, SchedulerError> {
        let batch = self.scheduler.commit_tick()?;
        self.telemetry.record_patch(&batch);
        self.telemetry.finalize_tick(TickResult::Commit);
        Ok(batch)
    }

    pub fn telemetry(&self) -> &TelemetryRecorder {
        &self.telemetry
    }

    pub fn telemetry_mut(&mut self) -> &mut TelemetryRecorder {
        &mut self.telemetry
    }

    pub fn store(&self) -> &Store {
        &self.store
    }
}

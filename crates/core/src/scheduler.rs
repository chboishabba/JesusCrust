use crate::effects::EffectQueue;
use crate::patch::{PatchBatch, PatchOp};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SchedulerError {
    TickAlreadyStarted,
    TickNotStarted,
}

#[derive(Debug, Clone)]
pub struct Scheduler {
    state: TickState,
    queue: EffectQueue,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum TickState {
    Idle,
    Active,
}

impl Scheduler {
    pub fn new() -> Self {
        Self {
            state: TickState::Idle,
            queue: EffectQueue::new(),
        }
    }

    pub fn begin_tick(&mut self) -> Result<(), SchedulerError> {
        if self.state == TickState::Active {
            return Err(SchedulerError::TickAlreadyStarted);
        }
        self.state = TickState::Active;
        Ok(())
    }

    pub fn enqueue_op(&mut self, op: PatchOp) -> Result<(), SchedulerError> {
        if self.state != TickState::Active {
            return Err(SchedulerError::TickNotStarted);
        }
        self.queue.push(op);
        Ok(())
    }

    pub fn commit_tick(&mut self) -> Result<PatchBatch, SchedulerError> {
        if self.state != TickState::Active {
            return Err(SchedulerError::TickNotStarted);
        }
        self.state = TickState::Idle;
        Ok(self.queue.commit())
    }
}

impl Default for Scheduler {
    fn default() -> Self {
        Self::new()
    }
}

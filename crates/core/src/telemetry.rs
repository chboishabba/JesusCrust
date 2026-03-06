use crate::patch::PatchBatch;
use std::time::Duration;

#[cfg(feature = "phase6-telemetry")]
use std::time::Instant;

/// Represents the outcome of a tick.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TickResult {
    Commit,
    Rollback,
    Fallback,
}

impl Default for TickResult {
    fn default() -> Self {
        TickResult::Commit
    }
}

/// Duration breakdown for the major phases that telemetry tracks.
#[derive(Debug, Clone, Default)]
pub struct PhaseDurations {
    pub script_ms: f64,
    pub style_recalc_ms: f64,
    pub selector_invalidation_ms: f64,
    pub layout_ms: f64,
    pub render_ms: f64,
    pub total_ms: f64,
}

/// Counters that describe the amount of work a tick emitted.
#[derive(Debug, Clone, Default)]
pub struct WorkBreakdown {
    pub dom_mutations: usize,
    pub nodes_touched: usize,
    pub selectors_evaluated: usize,
    pub elements_invalidated: usize,
    pub restyled_elements: usize,
    pub patch_bytes: usize,
    pub patch_ops: usize,
}

/// Guardrail events such as rollbacks or fallbacks, along with the phase they happened in.
#[derive(Debug, Clone)]
pub struct GuardrailEvent {
    pub kind: TickResult,
    pub reason: String,
    pub phase: Option<String>,
}

impl GuardrailEvent {
    pub fn new(reason: impl Into<String>, phase: Option<String>, kind: TickResult) -> Self {
        Self {
            kind,
            reason: reason.into(),
            phase,
        }
    }
}

/// Captures a single tick’s telemetry snapshot. This is the data the Phase-6 UI consumes.
#[derive(Debug, Clone, Default)]
pub struct TickTelemetry {
    pub tick_id: u64,
    pub result: TickResult,
    pub durations: PhaseDurations,
    pub work: WorkBreakdown,
    pub fingerprint: Option<u64>,
    pub guardrail: Option<GuardrailEvent>,
}

/// Phase-6 telemetry fields aligned with docs/phase6_telemetry_schema.md.
#[derive(Debug, Clone, Default)]
pub struct Phase6TelemetrySample {
    pub tick_id: u64,
    pub commit_id: u64,
    pub fingerprint: Option<u64>,
    pub total_tick_ms: f64,
    pub script_ms: f64,
    pub style_recalc_ms: f64,
    pub selector_invalidation_ms: f64,
    pub layout_ms: f64,
    pub render_ms: f64,
    pub selectors_evaluated: usize,
    pub elements_invalidated: usize,
    pub restyled_elements: usize,
    pub patch_ops: usize,
    pub patch_bytes: usize,
    pub fallback_kind: Option<TickResult>,
    pub fallback_reason: Option<String>,
}

#[cfg(feature = "phase6-telemetry")]
#[derive(Debug)]
pub struct TelemetryRecorder {
    ticks: Vec<TickTelemetry>,
    current: Option<ActiveTick>,
    next_tick_id: u64,
}

#[cfg(feature = "phase6-telemetry")]
#[derive(Debug)]
struct ActiveTick {
    tick_id: u64,
    start: Instant,
    durations: PhaseDurations,
    work: WorkBreakdown,
    fingerprint: Option<u64>,
    guardrail: Option<GuardrailEvent>,
}

#[cfg(feature = "phase6-telemetry")]
impl TelemetryRecorder {
    pub fn new() -> Self {
        Self {
            ticks: Vec::new(),
            current: None,
            next_tick_id: 1,
        }
    }

    pub fn begin_tick(&mut self) {
        let tick_id = self.next_tick_id;
        self.next_tick_id += 1;
        self.current = Some(ActiveTick {
            tick_id,
            start: Instant::now(),
            durations: PhaseDurations::default(),
            work: WorkBreakdown::default(),
            fingerprint: None,
            guardrail: None,
        });
    }

    pub fn record_style_duration(&mut self, duration: Duration) {
        if let Some(current) = &mut self.current {
            current.durations.style_recalc_ms += duration.as_secs_f64() * 1000.0;
        }
    }

    pub fn record_style_recalc_duration(&mut self, duration: Duration) {
        self.record_style_duration(duration);
    }

    pub fn record_layout_duration(&mut self, duration: Duration) {
        if let Some(current) = &mut self.current {
            current.durations.layout_ms += duration.as_secs_f64() * 1000.0;
        }
    }

    pub fn record_render_duration(&mut self, duration: Duration) {
        if let Some(current) = &mut self.current {
            current.durations.render_ms += duration.as_secs_f64() * 1000.0;
        }
    }

    pub fn record_selector_invalidation(
        &mut self,
        duration: Duration,
        selectors_evaluated: usize,
        elements_invalidated: usize,
        restyled_elements: usize,
    ) {
        if let Some(current) = &mut self.current {
            let elapsed_ms = duration.as_secs_f64() * 1000.0;
            current.durations.style_recalc_ms += elapsed_ms;
            current.durations.selector_invalidation_ms += elapsed_ms;
            current.work.selectors_evaluated += selectors_evaluated;
            current.work.elements_invalidated += elements_invalidated;
            current.work.nodes_touched += elements_invalidated;
            current.work.restyled_elements += restyled_elements;
        }
    }

    pub fn record_selector_evaluation(&mut self, duration: Duration, elements_invalidated: usize) {
        self.record_selector_invalidation(duration, 1, elements_invalidated, 0);
    }

    pub fn record_node_touches(&mut self, count: usize) {
        if let Some(current) = &mut self.current {
            current.work.nodes_touched += count;
        }
    }

    pub fn record_patch(&mut self, batch: &PatchBatch) {
        if let Some(current) = &mut self.current {
            let bytes = estimate_patch_bytes(batch);
            let ops = batch.len();
            current.work.dom_mutations = ops;
            current.work.patch_ops = ops;
            current.work.patch_bytes = bytes;
            current.fingerprint = Some(fingerprint_from_batch(batch));
        }
    }

    pub fn record_guardrail(&mut self, event: GuardrailEvent) {
        if let Some(current) = &mut self.current {
            current.guardrail = Some(event);
        }
    }

    pub fn finalize_tick(&mut self, result: TickResult) {
        if let Some(active) = self.current.take() {
            let total_ms = active.start.elapsed().as_secs_f64() * 1000.0;
            let style_ms = active.durations.style_recalc_ms;
            let layout_ms = active.durations.layout_ms;
            let render_ms = active.durations.render_ms;
            let script_ms = (total_ms - (style_ms + layout_ms + render_ms)).max(0.0);
            let durations = PhaseDurations {
                script_ms,
                style_recalc_ms: style_ms,
                selector_invalidation_ms: active.durations.selector_invalidation_ms,
                layout_ms,
                render_ms,
                total_ms,
            };
            let telemetry = TickTelemetry {
                tick_id: active.tick_id,
                result,
                durations,
                work: active.work,
                fingerprint: active.fingerprint,
                guardrail: active.guardrail,
            };
            self.ticks.push(telemetry);
        }
    }

    pub fn snapshot(&self) -> Vec<TickTelemetry> {
        self.ticks.clone()
    }

    pub fn last_tick(&self) -> Option<&TickTelemetry> {
        self.ticks.last()
    }

    pub fn current_tick_id(&self) -> Option<u64> {
        self.current.as_ref().map(|active| active.tick_id)
    }

    pub fn phase6_snapshot(&self) -> Vec<Phase6TelemetrySample> {
        self.ticks
            .iter()
            .map(|tick| {
                let guardrail = tick.guardrail.as_ref();
                Phase6TelemetrySample {
                    tick_id: tick.tick_id,
                    commit_id: tick.tick_id,
                    fingerprint: tick.fingerprint,
                    total_tick_ms: tick.durations.total_ms,
                    script_ms: tick.durations.script_ms,
                    style_recalc_ms: tick.durations.style_recalc_ms,
                    selector_invalidation_ms: tick.durations.selector_invalidation_ms,
                    layout_ms: tick.durations.layout_ms,
                    render_ms: tick.durations.render_ms,
                    selectors_evaluated: tick.work.selectors_evaluated,
                    elements_invalidated: tick.work.elements_invalidated,
                    restyled_elements: tick.work.restyled_elements,
                    patch_ops: if tick.work.patch_ops > 0 {
                        tick.work.patch_ops
                    } else {
                        tick.work.dom_mutations
                    },
                    patch_bytes: tick.work.patch_bytes,
                    fallback_kind: guardrail.map(|event| event.kind),
                    fallback_reason: guardrail.map(|event| event.reason.clone()),
                }
            })
            .collect()
    }
}

#[cfg(feature = "phase6-telemetry")]
fn estimate_patch_bytes(batch: &[crate::patch::PatchOp]) -> usize {
    const NODE_ID_BYTES: usize = std::mem::size_of::<u64>();
    batch
        .iter()
        .map(|op| match op {
            crate::patch::PatchOp::SetText { node: _, text } => NODE_ID_BYTES + text.len(),
            crate::patch::PatchOp::SetAttr {
                node: _,
                name,
                value,
            } => NODE_ID_BYTES * 2 + name.len() + value.len(),
            crate::patch::PatchOp::Insert {
                parent: _,
                child: _,
            } => NODE_ID_BYTES * 2,
            crate::patch::PatchOp::Remove { node: _ } => NODE_ID_BYTES,
        })
        .sum()
}

#[cfg(feature = "phase6-telemetry")]
fn fingerprint_from_batch(batch: &[crate::patch::PatchOp]) -> u64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    batch.hash(&mut hasher);
    hasher.finish()
}

#[cfg(not(feature = "phase6-telemetry"))]
#[derive(Debug)]
pub struct TelemetryRecorder;

#[cfg(not(feature = "phase6-telemetry"))]
impl TelemetryRecorder {
    pub fn new() -> Self {
        Self
    }

    pub fn begin_tick(&mut self) {}
    pub fn record_style_duration(&mut self, _duration: Duration) {}
    pub fn record_style_recalc_duration(&mut self, _duration: Duration) {}
    pub fn record_layout_duration(&mut self, _duration: Duration) {}
    pub fn record_render_duration(&mut self, _duration: Duration) {}
    pub fn record_selector_invalidation(
        &mut self,
        _duration: Duration,
        _selectors: usize,
        _elements_invalidated: usize,
        _restyled_elements: usize,
    ) {
    }
    pub fn record_selector_evaluation(&mut self, _duration: Duration, _elements: usize) {}
    pub fn record_node_touches(&mut self, _count: usize) {}
    pub fn record_patch(&mut self, _batch: &PatchBatch) {}
    pub fn record_guardrail(&mut self, _event: GuardrailEvent) {}
    pub fn finalize_tick(&mut self, _result: TickResult) {}
    pub fn snapshot(&self) -> Vec<TickTelemetry> {
        Vec::new()
    }
    pub fn last_tick(&self) -> Option<&TickTelemetry> {
        None
    }
    pub fn current_tick_id(&self) -> Option<u64> {
        None
    }
    pub fn phase6_snapshot(&self) -> Vec<Phase6TelemetrySample> {
        Vec::new()
    }
}

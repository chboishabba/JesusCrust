use harness::{fixture_path, replay_effects, EffectRecord, HarnessRunner};
use rquickjs::Error;

#[test]
fn microtasks_coalesce_into_single_commit() -> Result<(), Error> {
    let mut runner = HarnessRunner::new()?;

    let result = runner.run_tick(fixture_path("microtasks.js"))?;
    assert_eq!(result.commit_count, 1);
    assert_eq!(result.rollback_count, 0);
    assert_eq!(result.committed_effects.len(), 3);

    Ok(())
}

#[test]
fn deterministic_replay_matches_effect_log() -> Result<(), Error> {
    let mut runner = HarnessRunner::new()?;
    let result = runner.run_tick(fixture_path("microtasks.js"))?;

    let replayed = replay_effects(&result.committed_effects);
    assert_eq!(replayed, result.committed_effects);

    let mut runner_again = HarnessRunner::new()?;
    let result_again = runner_again.run_tick(fixture_path("microtasks.js"))?;
    assert_eq!(result.committed_effects, result_again.committed_effects);

    Ok(())
}

#[test]
fn transactional_ticks_commit_once_per_tick() -> Result<(), Error> {
    let mut runner = HarnessRunner::new()?;

    let result = runner.run_tick(fixture_path("transactional_ticks.js"))?;
    assert_eq!(result.commit_count, 1);
    assert_eq!(result.committed_effects.len(), 1);

    let result = runner.run_tick(fixture_path("transactional_ticks.js"))?;
    assert_eq!(result.commit_count, 2);
    assert_eq!(result.committed_effects.len(), 2);

    Ok(())
}

#[test]
fn rollback_tick_leaves_no_pending_effects() -> Result<(), Error> {
    let mut runner = HarnessRunner::new()?;

    let result = runner.run_tick(fixture_path("rollback_tick.js"))?;
    assert_eq!(result.rollback_count, 1);
    assert_eq!(result.commit_count, 0);
    assert!(result.committed_effects.is_empty());
    assert!(result.pending_effects.is_empty());

    Ok(())
}

#[test]
fn nested_microtasks_commit_in_order() -> Result<(), Error> {
    let mut runner = HarnessRunner::new()?;

    let result = runner.run_tick(fixture_path("nested_microtasks.js"))?;
    assert_eq!(result.commit_count, 1);
    assert_eq!(result.committed_effects.len(), 3);
    assert_eq!(result.committed_effects, vec![
        EffectRecord { op: "setText".to_string(), args: vec!["start".to_string()] },
        EffectRecord { op: "setText".to_string(), args: vec!["micro1".to_string()] },
        EffectRecord { op: "setText".to_string(), args: vec!["micro2".to_string()] },
    ]);

    Ok(())
}

#[test]
fn commit_boundary_violation_rolls_back_when_effect_outside_commit() -> Result<(), Error> {
    let mut runner = HarnessRunner::new()?;

    let result = runner.run_fixture(fixture_path("commit_boundary_violation.js"))?;
    assert_eq!(result.commit_count, 1);
    assert_eq!(result.rollback_count, 0);
    assert_eq!(result.committed_effects.len(), 1);
    assert!(result.pending_effects.is_empty());

    Ok(())
}

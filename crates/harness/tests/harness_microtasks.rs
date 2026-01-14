use harness::{fixture_path, replay_effects, HarnessRunner};
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

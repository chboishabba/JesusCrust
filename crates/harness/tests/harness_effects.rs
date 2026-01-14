use harness::{fixture_path, EffectRecord, HarnessRunner};
use rquickjs::Error;

#[test]
fn forbidden_ops_trigger_rollback() -> Result<(), Error> {
    let mut runner = HarnessRunner::new()?;

    let result = runner.run_fixture(fixture_path("allowed_ops.js"))?;
    assert_eq!(result.commit_count, 1);
    assert_eq!(result.rollback_count, 0);

    let result = runner.run_fixture(fixture_path("forbidden_ops.js"))?;
    assert_eq!(result.commit_count, 1);
    assert_eq!(result.rollback_count, 1);
    assert_eq!(
        result.committed_effects,
        vec![EffectRecord {
            op: "append".to_string(),
            args: vec!["ok".to_string()],
        }]
    );

    Ok(())
}

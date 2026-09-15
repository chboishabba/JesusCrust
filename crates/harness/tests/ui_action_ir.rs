use harness::{ActionKind, UiProgram};

#[test]
fn parses_human_readable_reading_trail_without_json() {
    let src = r#"
open mabo
click terra-nullius
inspect-source hca:mabo-1992
back
assert-visible mabo-summary
"#;

    let program = UiProgram::parse(src).expect("program parses");

    assert_eq!(program.steps().len(), 5);
    assert_eq!(program.steps()[0].kind(), ActionKind::Open);
    assert_eq!(program.steps()[2].kind(), ActionKind::InspectSource);
    assert_eq!(program.steps()[3].kind(), ActionKind::Back);
    assert_eq!(program.steps()[4].target(), "mabo-summary");
}

#[test]
fn reports_abstract_cost_by_action_class() {
    let program = UiProgram::parse(
        "open mabo\nclick terra-nullius\ninspect-source hca:mabo-1992\nassert-visible source-span\n",
    )
    .unwrap();

    let cost = program.abstract_cost();

    assert_eq!(cost.navigation, 2);
    assert_eq!(cost.inspection, 1);
    assert_eq!(cost.assertion, 1);
    assert_eq!(cost.mutation, 0);
}

#[test]
fn unknown_action_fails_closed() {
    let err = UiProgram::parse("teleport mabo").unwrap_err();
    assert!(err.to_string().contains("unknown UI action"));
}

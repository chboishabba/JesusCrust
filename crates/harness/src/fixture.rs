use std::path::{Path, PathBuf};

pub fn fixture_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../tests/js")
}

pub fn fixture_path(name: &str) -> PathBuf {
    fixture_root().join(name)
}

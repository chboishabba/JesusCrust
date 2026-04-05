host.begin();
host.effect("setText", "start");
host.commit();
let violationThrew = false;
try {
  host.effect("setText", "after-commit");
} catch (err) {
  violationThrew = true;
}

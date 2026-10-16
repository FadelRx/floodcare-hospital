import test from "node:test";
import assert from "node:assert/strict";
import { assertFeatureEnabled, effectiveModules } from "@/lib/features";
test("runtime module settings cannot exceed installed ceiling", () => {
  assert.deepEqual(effectiveModules(["bcp", "stock"], ["bcp", "patients"]), ["bcp"]);
  assert.throws(() => assertFeatureEnabled("patients", ["bcp"]));
});

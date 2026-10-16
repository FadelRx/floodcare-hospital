import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { MODULE_KEYS } from "@/config/schema";
import { moduleCatalog, validateModuleRecord } from "@/lib/modules/catalog";
import { canAccessModule, normalizeWorkScopes } from "@/lib/auth/access";
import { effectiveModuleKeys } from "@/lib/features";
import { buildD1Args, parseWranglerDatabaseName } from "../scripts/wrangler-args.mjs";

test("all advertised modules have distinct closed schemas and statuses", () => {
  assert.deepEqual(Object.keys(moduleCatalog).sort(), [...MODULE_KEYS].sort());
  for (const key of MODULE_KEYS) {
    const definition = moduleCatalog[key];
    assert.ok(definition.labelTh.length > 0);
    assert.ok(definition.scope.length > 0);
    assert.ok(definition.statuses.length >= 2);
    assert.ok(definition.fields.length >= 2);
    assert.equal(validateModuleRecord(key, { status: definition.statuses[0], unknown: "x" }).ok, false);
  }
});

test("patient and dialysis require PDPA basis plus consent evidence and reject arbitrary payloads", () => {
  for (const key of ["patients", "dialysis"] as const) {
    const missing = validateModuleRecord(key, { status: moduleCatalog[key].statuses[0] });
    assert.equal(missing.ok, false);
    const source = JSON.stringify(moduleCatalog[key]);
    assert.match(source, /legalBasis/);
    assert.match(source, /consentReference/);
  }
});

test("runtime settings are a subset of installed modules with safe defaults for missing rows", () => {
  assert.deepEqual(effectiveModuleKeys(["bcp", "stock"], ["bcp"], [{ module_key: "bcp", enabled: 0 }]), []);
  assert.deepEqual(effectiveModuleKeys(["bcp", "stock"], ["bcp"], []), ["bcp"]);
  assert.deepEqual(effectiveModuleKeys(["bcp"], ["bcp"], [{ module_key: "patients", enabled: 1 }]), ["bcp"]);
});

test("staff scopes are normalized and sensitive modules require explicit sensitive scope", () => {
  assert.deepEqual(normalizeWorkScopes(["stock", "stock", "bogus"]), ["stock"]);
  assert.equal(canAccessModule({ role: "Staff", workScopes: ["stock"] }, "stock", "write"), true);
  assert.equal(canAccessModule({ role: "Staff", workScopes: ["patients"] }, "patients", "read"), false);
  assert.equal(canAccessModule({ role: "Staff", workScopes: ["patients", "sensitive:patients"] }, "patients", "read"), true);
  assert.equal(canAccessModule({ role: "UnitAdmin", workScopes: [] }, "dialysis", "write"), true);
});

test("wrangler arguments use parsed database_name and remote is explicit", () => {
  const jsonc = `{// comment\n "d1_databases": [{"binding":"DB", "database_name":"example-local"}]}`;
  assert.equal(parseWranglerDatabaseName(jsonc), "example-local");
  assert.deepEqual(buildD1Args({ database: "example-local", remote: false, command: "SELECT 1" }), ["wrangler", "d1", "execute", "example-local", "--local", "--command", "SELECT 1"]);
  assert.throws(() => buildD1Args({ database: "example-local", remote: true, command: "SELECT 1" }), /confirm/i);
});

test("migration stores structured sensitive fields and work scopes, not fake encryption", async () => {
  const sql = await readFile("migrations/0000_baseline.sql", "utf8");
  assert.doesNotMatch(sql, /encrypted_payload/i);
  assert.match(sql, /work_scopes_json/i);
  assert.match(sql, /legal_basis/i);
  assert.match(sql, /consent_reference/i);
});

test("logout revokes server sessions and audits atomically", async () => {
  const route = await readFile("app/api/auth/logout/route.ts", "utf8");
  assert.match(route, /db\.batch/);
  assert.match(route, /session_version\s*=\s*session_version\s*\+\s*1/);
  assert.match(route, /auditStatement/);
});

test("module API has bounded bodies, centralized access, runtime feature state, and affected-row checks", async () => {
  const route = await readFile("app/api/modules/[module]/records/route.ts", "utf8");
  assert.match(route, /readJsonBody/);
  assert.match(route, /canAccessModule/);
  assert.match(route, /enabledModules/);
  assert.match(route, /changes/);
});

test("setup exposes module selection and opt-in unconfirmed discovery without secrets", async () => {
  const source = await readFile("scripts/setup.mjs", "utf8");
  assert.match(source, /--discover-nearby/);
  assert.match(source, /registry-url/);
  assert.match(source, /status:\s*"unconfirmed"/);
  assert.match(source, /modules/);
  assert.doesNotMatch(source, /AUTH_SECRET|password/i);
});

test("user management enforces UnitAdmin-to-Staff boundary and SystemAdmin safety", async () => {
  const create = await readFile("app/api/users/route.ts", "utf8");
  const update = await readFile("app/api/users/[id]/route.ts", "utf8");
  assert.match(create, /canManageRole/);
  assert.match(create, /workScopes/);
  assert.match(update, /last SystemAdmin/);
  assert.match(update, /current SystemAdmin/);
  assert.match(update, /unit does not belong/);
  assert.match(create, /assignableWorkScopes/);
  assert.match(update, /assignableWorkScopes/);
});

test("login uses bounded input and checks independent account and IP counters", async () => {
  const route = await readFile("app/api/auth/login/route.ts", "utf8");
  assert.match(route, /readJsonBody/);
  assert.match(route, /loginAttemptKeys/);
  assert.match(route, /ACCOUNT_LOGIN_LIMIT/);
  assert.match(route, /IP_LOGIN_LIMIT/);
  assert.doesNotMatch(route, /request\.json/);
});

test("doctor separates CI template validation from deployment validation and scans tracked source", async () => {
  const source = await readFile("scripts/doctor.mjs", "utf8");
  assert.match(source, /ci\?exampleConfig:deploymentConfig/);
  assert.match(source, /git[\s\S]*ls-files/);
  assert.match(source, /migration sensitive schema/);
  assert.doesNotMatch(source, /wrangler\s+(?:whoami|login)/);
});

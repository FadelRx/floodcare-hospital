import test from "node:test";
import assert from "node:assert/strict";
import { buildSecurityHeaders } from "../next.config";

test("production headers harden every route without unsafe-eval", async () => {
  const headers = Object.fromEntries(buildSecurityHeaders(true).map(({ key, value }) => [key, value]));
  assert.match(headers["Content-Security-Policy"] ?? "", /script-src[^;]*'self'/);
  assert.doesNotMatch(headers["Content-Security-Policy"] ?? "", /'unsafe-eval'/);
  assert.match(headers["Content-Security-Policy"] ?? "", /frame-ancestors 'none'/);
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.ok(headers["Referrer-Policy"]);
  assert.ok(headers["Permissions-Policy"]);
  assert.match(headers["Strict-Transport-Security"] ?? "", /max-age=/);
});

test("Next applies the security header set to all routes", async () => {
  const config = (await import("../next.config")).default;
  const rules = await config.headers?.();
  assert.equal(rules?.[0]?.source, "/(.*)");
});

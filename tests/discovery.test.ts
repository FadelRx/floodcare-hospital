import test from "node:test";
import assert from "node:assert/strict";
import { haversineKm } from "@/lib/discovery/geo";
import { rankDdpmCandidates, ddpmImageUrl } from "@/lib/discovery/ddpm";
import { rankTeleridCandidates } from "@/lib/discovery/telerid";
import { rankThaiWaterCandidates } from "@/lib/discovery/thaiwater";

test("haversine rejects invalid coordinates and 0,0", () => {
  assert.equal(haversineKm({ lat: 0, lon: 0 }, { lat: 13, lon: 100 }), null);
  assert.equal(haversineKm({ lat: 91, lon: 0 }, { lat: 13, lon: 100 }), null);
  assert.ok((haversineKm({ lat: 13, lon: 100 }, { lat: 13.1, lon: 100 }) ?? 0) > 10);
});
test("DDPM ranks nearer candidates and uses liveFrame for no_image", () => {
  const ranked = rankDdpmCandidates({ lat: 13, lon: 100 }, [{ code: "far", lat: 14, lon: 100 }, { code: "near", lat: 13.1, lon: 100 }]);
  assert.equal(ranked[0]?.code, "near");
  assert.equal(ddpmImageUrl({ image: "no_image", liveFrame: "https://example.invalid/live.jpg" }), "https://example.invalid/live.jpg");
});
test("Telerid requires same basin/province, freshness, then distance and does not invent CCTV", () => {
  const ranked = rankTeleridCandidates({ lat: 13, lon: 100, basin: "A", province: "P" }, [
    { id: "wrong", lat: 13, lon: 100, basin: "B", province: "P", observedAt: "2026-10-17T00:00:00Z", cctv: [] },
    { id: "ok", lat: 13.2, lon: 100, basin: "A", province: "P", observedAt: "2026-10-17T01:00:00Z", cctv: [] },
  ], new Date("2026-10-17T02:00:00Z"));
  assert.equal(ranked[0]?.id, "ok");
  assert.equal(ranked[0]?.cameraPath, null);
});
test("ThaiWater confirmed upstream relationship outranks distance", () => {
  const ranked = rankThaiWaterCandidates({ lat: 13, lon: 100 }, [{ id: "near", lat: 13.01, lon: 100, relationship: "nearby" }, { id: "up", lat: 14, lon: 100, relationship: "upstream-confirmed" }]);
  assert.equal(ranked[0]?.id, "up");
});

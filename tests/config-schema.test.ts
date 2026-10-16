import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CONFIG_PLACEHOLDER,
  MODULE_KEYS,
  findPlaceholders,
  missingModuleDependencies,
  validateHospitalConfig,
  type HospitalConfig,
} from "@/config/schema";
import exampleConfig from "@/config/hospital.config.example";

/** config ที่ครบถ้วน (ค่าสมมุติล้วน ไม่ใช่โรงพยาบาลจริง) — ใช้เป็นฐานของแต่ละเคส */
function validConfig(): HospitalConfig {
  return {
    schemaVersion: 1,
    identity: {
      id: "example-hospital",
      hcode: "99999",
      nameTh: "โรงพยาบาลตัวอย่าง",
      shortNameTh: "รพ.ตัวอย่าง",
      nameEn: "Example Hospital",
      province: "ตัวอย่าง",
      district: "เมืองตัวอย่าง",
      timezone: "Asia/Bangkok",
    },
    location: { lat: 13.5, lon: 100.5, elevationM: null },
    branding: {
      appName: "FloodCare Hospital",
      logoPath: "/brand/floodcare-logo.png",
      primaryColor: "#0f766e",
    },
    modules: {
      installed: ["bcp", "departmentReadiness", "wardCapacity", "stock", "recovery"],
      defaultEnabled: ["bcp", "departmentReadiness", "wardCapacity", "stock", "recovery"],
    },
    water: {
      thaiwater: { direct: [], upstream: [] },
      riverChain: { status: "unconfirmed" },
      ddpm: { stationCodes: [] },
      telerid: { stationIds: [] },
    },
    integrations: {
      thaiwater: false,
      ddpm: false,
      telerid: false,
      gistda: false,
      hiiFlashFlood: false,
      hosxpWardBridge: false,
      r2Uploads: false,
    },
    auth: { mode: "local" },
  };
}

const errorsOf = (input: unknown): string[] => {
  const r = validateHospitalConfig(input);
  return r.ok ? [] : r.errors;
};

test("config ที่ครบถ้วนผ่านการตรวจ และคืนค่าที่ตรวจแล้ว", () => {
  const r = validateHospitalConfig(validConfig());
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.config.identity.id, "example-hospital");
});

test("รายการโมดูลที่ติดตั้งได้ครบตามที่กำหนด v1", () => {
  assert.deepEqual(
    [...MODULE_KEYS].sort(),
    [
      "bcp",
      "departmentReadiness",
      "dialysis",
      "mission",
      "patients",
      "recovery",
      "sat",
      "stock",
      "transport",
      "wardCapacity",
    ].sort(),
  );
});

test("ไม่ใช่ object → ปฏิเสธ", () => {
  assert.ok(errorsOf(null).length > 0);
  assert.ok(errorsOf("x").length > 0);
});

test("schemaVersion ต้องเป็น 1", () => {
  assert.ok(errorsOf({ ...validConfig(), schemaVersion: 2 }).some((e) => e.includes("schemaVersion")));
});

test("identity.id ต้องเป็น slug ตัวพิมพ์เล็ก", () => {
  for (const bad of ["", "Has Space", "UPPER", "-lead", "a", "x".repeat(41), "../etc"]) {
    const c = validConfig();
    c.identity.id = bad;
    assert.ok(errorsOf(c).some((e) => e.includes("identity.id")), `ต้องปฏิเสธ ${JSON.stringify(bad)}`);
  }
});

test("hcode ต้องเป็นตัวเลข 5 หลัก", () => {
  for (const bad of ["1234", "123456", "abcde", ""]) {
    const c = validConfig();
    c.identity.hcode = bad;
    assert.ok(errorsOf(c).some((e) => e.includes("identity.hcode")), `ต้องปฏิเสธ ${bad}`);
  }
});

test("timezone รองรับเฉพาะ Asia/Bangkok ใน v1", () => {
  const c = validConfig() as unknown as { identity: { timezone: string } };
  c.identity.timezone = "UTC";
  assert.ok(errorsOf(c).some((e) => e.includes("identity.timezone")));
});

test("พิกัดต้องอยู่ในช่วงที่ถูกต้อง และไม่ใช่ 0,0", () => {
  for (const [lat, lon] of [
    [0, 0],
    [91, 100],
    [13, 181],
    [Number.NaN, 100],
  ]) {
    const c = validConfig();
    c.location.lat = lat;
    c.location.lon = lon;
    assert.ok(errorsOf(c).some((e) => e.startsWith("location.")), `ต้องปฏิเสธ ${lat},${lon}`);
  }
});

test("primaryColor ต้องเป็น hex 6 หลัก", () => {
  const c = validConfig();
  c.branding.primaryColor = "red";
  assert.ok(errorsOf(c).some((e) => e.includes("branding.primaryColor")));
});

test("logoPath ต้องเป็น path ภายในแอป (ไม่รับ URL ภายนอก)", () => {
  const c = validConfig();
  c.branding.logoPath = "https://example.com/logo.png";
  assert.ok(errorsOf(c).some((e) => e.includes("branding.logoPath")));
});

test("โมดูลไม่รู้จัก/ซ้ำ → ปฏิเสธ", () => {
  const c = validConfig() as unknown as { modules: { installed: string[]; defaultEnabled: string[] } };
  c.modules.installed = ["bcp", "network"];
  assert.ok(errorsOf(c).some((e) => e.includes("network")));
  const d = validConfig();
  d.modules.installed = ["bcp", "bcp"];
  assert.ok(errorsOf(d).some((e) => e.includes("ซ้ำ")));
});

test("defaultEnabled ต้องอยู่ใต้เพดาน installed", () => {
  const c = validConfig();
  c.modules.installed = ["bcp"];
  c.modules.defaultEnabled = ["bcp", "stock"];
  assert.ok(errorsOf(c).some((e) => e.includes("modules.defaultEnabled") && e.includes("stock")));
});

test("dependency ของโมดูล: dialysis ต้องมี patients, mission ต้องมี stock", () => {
  assert.deepEqual(missingModuleDependencies(["dialysis"]), [{ module: "dialysis", requires: "patients" }]);
  assert.deepEqual(missingModuleDependencies(["mission"]), [{ module: "mission", requires: "stock" }]);
  assert.deepEqual(missingModuleDependencies(["dialysis", "patients", "mission", "stock"]), []);

  const c = validConfig();
  c.modules.installed = ["dialysis"];
  c.modules.defaultEnabled = [];
  assert.ok(errorsOf(c).some((e) => e.includes("dialysis") && e.includes("patients")));
});

test("รหัสสถานีวัดน้ำต้องเป็นข้อความสั้นที่ปลอดภัย ไม่ซ้ำกันระหว่าง direct/upstream", () => {
  const c = validConfig();
  c.water.thaiwater.direct = ["X.1", "bad code;"];
  assert.ok(errorsOf(c).some((e) => e.includes("water.thaiwater.direct")));
  const d = validConfig();
  d.water.thaiwater.direct = ["X.1"];
  d.water.thaiwater.upstream = ["X.1"];
  assert.ok(errorsOf(d).some((e) => e.includes("X.1")));
});

test("สถานีต้นน้ำ (upstream) ใช้ได้เฉพาะเมื่อมนุษย์ยืนยันลำน้ำแล้ว", () => {
  const c = validConfig();
  c.water.thaiwater.upstream = ["X.2"];
  c.water.riverChain = { status: "unconfirmed" };
  assert.ok(errorsOf(c).some((e) => e.includes("water.riverChain")));

  const ok = validConfig();
  ok.water.thaiwater.upstream = ["X.2"];
  ok.water.riverChain = {
    status: "confirmed",
    confirmedBy: "ฝ่ายอาคารสถานที่",
    confirmedAt: "2026-10-01",
  };
  assert.deepEqual(errorsOf(ok), []);
});

test("riverChain ที่ยืนยันแล้วต้องระบุผู้ยืนยันและวันที่", () => {
  const c = validConfig();
  c.water.riverChain = { status: "confirmed" };
  assert.ok(errorsOf(c).some((e) => e.includes("water.riverChain.confirmedBy")));
});

test("integration ต้องเป็น boolean ทุกตัว", () => {
  const c = validConfig() as unknown as { integrations: Record<string, unknown> };
  c.integrations.thaiwater = "yes";
  assert.ok(errorsOf(c).some((e) => e.includes("integrations.thaiwater")));
});

test("auth.mode รองรับเฉพาะ local ใน v1", () => {
  const c = validConfig() as unknown as { auth: { mode: string } };
  c.auth.mode = "hr-webhook";
  assert.ok(errorsOf(c).some((e) => e.includes("auth.mode")));
});

test("findPlaceholders ชี้ path ของค่าที่ยังเป็น placeholder", () => {
  const c = validConfig();
  c.identity.nameTh = CONFIG_PLACEHOLDER;
  c.identity.hcode = "00000";
  const paths = findPlaceholders(c);
  assert.ok(paths.includes("identity.nameTh"));
  assert.ok(paths.includes("identity.hcode"));
  assert.deepEqual(findPlaceholders(validConfig()), []);
});

test("config ตัวอย่างมีรูปแบบถูกต้อง แต่ยังมี placeholder (ห้าม deploy ทั้งอย่างนั้น)", () => {
  const r = validateHospitalConfig(exampleConfig);
  assert.equal(r.ok, true, r.ok ? "" : r.errors.join("\n"));
  const paths = findPlaceholders(exampleConfig);
  for (const p of ["identity.id", "identity.hcode", "identity.nameTh", "identity.province", "location"]) {
    assert.ok(paths.includes(p), `ตัวอย่างต้องมี placeholder ที่ ${p}`);
  }
});

test("config ตัวอย่างเปิดโมดูลเริ่มต้นตามที่กำหนด และติดตั้งครบทุกโมดูล", () => {
  assert.deepEqual(
    [...exampleConfig.modules.defaultEnabled].sort(),
    ["bcp", "departmentReadiness", "recovery", "stock", "wardCapacity"],
  );
  assert.deepEqual([...exampleConfig.modules.installed].sort(), [...MODULE_KEYS].sort());
  assert.equal(exampleConfig.auth.mode, "local");
  assert.equal(exampleConfig.identity.timezone, "Asia/Bangkok");
});

export const MODULE_KEYS = ["sat", "bcp", "departmentReadiness", "wardCapacity", "stock", "transport", "patients", "dialysis", "recovery", "mission"] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];
export const DEFAULT_MODULES: ModuleKey[] = ["bcp", "departmentReadiness", "wardCapacity", "stock", "recovery"];
export const CONFIG_PLACEHOLDER = "CHANGE_ME";

export type HospitalConfig = {
  schemaVersion: 1;
  identity: { id: string; hcode: string; nameTh: string; shortNameTh: string; nameEn: string; province: string; district: string; timezone: "Asia/Bangkok" };
  location: { lat: number; lon: number; elevationM: number | null };
  branding: { appName: string; logoPath: string; primaryColor: string };
  modules: { installed: ModuleKey[]; defaultEnabled: ModuleKey[] };
  water: {
    thaiwater: { direct: string[]; upstream: string[] };
    riverChain: { status: "unconfirmed" } | { status: "confirmed"; confirmedBy?: string; confirmedAt?: string };
    ddpm: { stationCodes: string[] };
    telerid: { stationIds: string[] };
    suggestions?: Array<{ source: "thaiwater"|"ddpm"|"telerid"; id: string; distanceKm: number; status: "unconfirmed" }>;
  };
  integrations: { thaiwater: boolean; ddpm: boolean; telerid: boolean; gistda: boolean; hiiFlashFlood: boolean; hosxpWardBridge: boolean; r2Uploads: boolean };
  auth: { mode: "local" };
};

export type ValidationResult = { ok: true; config: HospitalConfig } | { ok: false; errors: string[] };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown) => typeof v === "string" && v.trim().length > 0;
const station = /^[A-Za-z0-9._:-]{1,64}$/;

export function missingModuleDependencies(modules: readonly string[]) {
  const deps: Partial<Record<ModuleKey, ModuleKey>> = { dialysis: "patients", mission: "stock" };
  return modules.flatMap((m) => deps[m as ModuleKey] && !modules.includes(deps[m as ModuleKey]!) ? [{ module: m, requires: deps[m as ModuleKey]! }] : []);
}

export function validateHospitalConfig(input: unknown): ValidationResult {
  const e: string[] = [];
  if (!object(input)) return { ok: false, errors: ["config must be an object"] };
  const c = input as unknown as HospitalConfig;
  if (c.schemaVersion !== 1) e.push("schemaVersion must be 1");
  if (!object(c.identity)) e.push("identity is required"); else {
    if (c.identity.id !== CONFIG_PLACEHOLDER && !/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(c.identity.id)) e.push("identity.id must be a lowercase slug (3-40 characters)");
    if (!/^\d{5}$/.test(c.identity.hcode)) e.push("identity.hcode must contain 5 digits");
    for (const k of ["nameTh", "shortNameTh", "nameEn", "province", "district"] as const) if (!text(c.identity[k])) e.push(`identity.${k} is required`);
    if (c.identity.timezone !== "Asia/Bangkok") e.push("identity.timezone must be Asia/Bangkok");
  }
  if (!object(c.location)) e.push("location is required"); else {
    const examplePlaceholder = c.identity?.id === CONFIG_PLACEHOLDER;
    if (!Number.isFinite(c.location.lat) || c.location.lat < -90 || c.location.lat > 90 || (!examplePlaceholder && c.location.lat === 0 && c.location.lon === 0)) e.push("location.lat is invalid");
    if (!Number.isFinite(c.location.lon) || c.location.lon < -180 || c.location.lon > 180 || (!examplePlaceholder && c.location.lat === 0 && c.location.lon === 0)) e.push("location.lon is invalid");
    if (c.location.elevationM !== null && !Number.isFinite(c.location.elevationM)) e.push("location.elevationM is invalid");
  }
  if (!object(c.branding)) e.push("branding is required"); else {
    if (!text(c.branding.appName)) e.push("branding.appName is required");
    if (typeof c.branding.logoPath !== "string" || !/^\/(?!\/)[^?#]*$/.test(c.branding.logoPath) || c.branding.logoPath.includes("..")) e.push("branding.logoPath must be an internal path");
    if (!/^#[0-9a-fA-F]{6}$/.test(c.branding.primaryColor)) e.push("branding.primaryColor must be a 6-digit hex color");
  }
  if (!object(c.modules) || !Array.isArray(c.modules.installed) || !Array.isArray(c.modules.defaultEnabled)) e.push("modules is invalid"); else {
    for (const list of ["installed", "defaultEnabled"] as const) {
      const values = c.modules[list] as string[];
      for (const m of values) if (!(MODULE_KEYS as readonly string[]).includes(m)) e.push(`modules.${list} contains unknown module ${m}`);
      if (new Set(values).size !== values.length) e.push(`modules.${list} มีค่าซ้ำ`);
    }
    for (const m of c.modules.defaultEnabled) if (!c.modules.installed.includes(m)) e.push(`modules.defaultEnabled module ${m} is not installed`);
    for (const d of missingModuleDependencies(c.modules.installed)) e.push(`${d.module} requires ${d.requires}`);
  }
  if (!object(c.water)) e.push("water is required"); else {
    const groups: Array<[string, unknown]> = [["water.thaiwater.direct", c.water.thaiwater?.direct], ["water.thaiwater.upstream", c.water.thaiwater?.upstream], ["water.ddpm.stationCodes", c.water.ddpm?.stationCodes], ["water.telerid.stationIds", c.water.telerid?.stationIds]];
    for (const [path, value] of groups) if (!Array.isArray(value) || value.some((x) => typeof x !== "string" || !station.test(x))) e.push(`${path} contains an invalid station identifier`);
    const direct = c.water.thaiwater?.direct ?? [], upstream = c.water.thaiwater?.upstream ?? [];
    for (const id of direct) if (upstream.includes(id)) e.push(`water station ${id} cannot be direct and upstream`);
    if (!object(c.water.riverChain) || !["confirmed", "unconfirmed"].includes(c.water.riverChain.status)) e.push("water.riverChain is invalid");
    else if (c.water.riverChain.status === "confirmed") {
      if (!text(c.water.riverChain.confirmedBy)) e.push("water.riverChain.confirmedBy is required");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(c.water.riverChain.confirmedAt ?? "")) e.push("water.riverChain.confirmedAt is required");
    } else if (upstream.length) e.push("water.riverChain must be confirmed before selecting upstream stations");
    if(c.water.suggestions!==undefined&&(!Array.isArray(c.water.suggestions)||c.water.suggestions.some(s=>!object(s)||!["thaiwater","ddpm","telerid"].includes(String(s.source))||typeof s.id!=="string"||!station.test(s.id)||typeof s.distanceKm!=="number"||!Number.isFinite(s.distanceKm)||s.distanceKm<0||s.status!=="unconfirmed")))e.push("water.suggestions is invalid");
  }
  const integrationKeys = ["thaiwater", "ddpm", "telerid", "gistda", "hiiFlashFlood", "hosxpWardBridge", "r2Uploads"] as const;
  if (!object(c.integrations)) e.push("integrations is required"); else for (const k of integrationKeys) if (typeof c.integrations[k] !== "boolean") e.push(`integrations.${k} must be boolean`);
  if (!object(c.auth) || c.auth.mode !== "local") e.push("auth.mode must be local");
  return e.length ? { ok: false, errors: e } : { ok: true, config: c };
}

export function findPlaceholders(config: HospitalConfig): string[] {
  const found: string[] = [];
  const walk = (v: unknown, path: string) => {
    if (typeof v === "string" && (v === CONFIG_PLACEHOLDER || (path === "identity.hcode" && v === "00000"))) found.push(path);
    else if (object(v)) for (const [k, child] of Object.entries(v)) walk(child, path ? `${path}.${k}` : k);
  };
  walk(config, "");
  if (config.location.lat === 0 && config.location.lon === 0) found.push("location");
  return found;
}

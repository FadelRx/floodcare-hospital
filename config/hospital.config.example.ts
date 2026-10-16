import { CONFIG_PLACEHOLDER, MODULE_KEYS, DEFAULT_MODULES, type HospitalConfig } from "./schema";
const config: HospitalConfig = {
  schemaVersion: 1,
  identity: { id: CONFIG_PLACEHOLDER, hcode: "00000", nameTh: CONFIG_PLACEHOLDER, shortNameTh: CONFIG_PLACEHOLDER, nameEn: "Example Hospital", province: CONFIG_PLACEHOLDER, district: CONFIG_PLACEHOLDER, timezone: "Asia/Bangkok" },
  location: { lat: 0, lon: 0, elevationM: null },
  branding: { appName: "FloodCare Hospital", logoPath: "/brand/floodcare-logo.svg", primaryColor: "#0f766e" },
  modules: { installed: [...MODULE_KEYS], defaultEnabled: [...DEFAULT_MODULES] },
  water: { thaiwater: { direct: [], upstream: [] }, riverChain: { status: "unconfirmed" }, ddpm: { stationCodes: [] }, telerid: { stationIds: [] } },
  integrations: { thaiwater: false, ddpm: false, telerid: false, gistda: false, hiiFlashFlood: false, hosxpWardBridge: false, r2Uploads: false },
  auth: { mode: "local" },
};
export default config;

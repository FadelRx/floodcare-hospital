import configured from "@/config/hospital.config";
import { findPlaceholders, validateHospitalConfig, type HospitalConfig } from "@/config/schema";

export function loadHospitalConfig(options: { production?: boolean } = {}): HospitalConfig {
  const result = validateHospitalConfig(configured);
  if (!result.ok) throw new Error(`Invalid hospital configuration:\n${result.errors.join("\n")}`);
  const production = options.production ?? process.env.NODE_ENV === "production";
  const placeholders = findPlaceholders(result.config);
  if (production && placeholders.length) throw new Error(`Production configuration contains placeholders: ${placeholders.join(", ")}`);
  return result.config;
}
export const hospitalConfig = loadHospitalConfig({ production: false });

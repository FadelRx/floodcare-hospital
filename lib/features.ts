import type { ModuleKey } from "@/config/schema";
import type { D1Database } from "@/lib/db";
import { hospitalConfig } from "@/lib/config/runtime";
export class FeatureDisabledError extends Error { status = 404; }
export function effectiveModules(installed: readonly string[], enabled: readonly string[]): string[] { return enabled.filter((m) => installed.includes(m)); }
export type ModuleSettingRow={module_key:string;enabled:number};
export function effectiveModuleKeys(installed:readonly ModuleKey[],defaults:readonly ModuleKey[],rows:readonly ModuleSettingRow[]):ModuleKey[]{const runtime=new Map(rows.map(r=>[r.module_key,r.enabled===1]));return installed.filter(m=>runtime.has(m)?runtime.get(m):defaults.includes(m));}
export async function enabledModules(db:D1Database):Promise<ModuleKey[]>{const rows=await db.prepare("SELECT module_key,enabled FROM module_settings WHERE hospital_id=?").bind(hospitalConfig.identity.id).all<ModuleSettingRow>();return effectiveModuleKeys(hospitalConfig.modules.installed,hospitalConfig.modules.defaultEnabled,rows.results??[])}
export function assertFeatureEnabled(module: ModuleKey, enabled: readonly string[]): void {
  if (!enabled.includes(module)) throw new FeatureDisabledError(`Module ${module} is disabled`);
}

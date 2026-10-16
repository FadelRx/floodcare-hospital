import { MODULE_KEYS,type ModuleKey } from "@/config/schema";
import type { Role } from "./session";
export type WorkScope=ModuleKey|`sensitive:${"patients"|"dialysis"}`;
const valid=new Set<string>([...MODULE_KEYS,"sensitive:patients","sensitive:dialysis"]);
export function normalizeWorkScopes(value:unknown):WorkScope[]{if(!Array.isArray(value))return[];return [...new Set(value.filter((x):x is WorkScope=>typeof x==="string"&&valid.has(x)))];}
export function assignableWorkScopes(actor:Role,value:unknown):WorkScope[]{const scopes=normalizeWorkScopes(value);return actor==="SystemAdmin"?scopes:scopes.filter(scope=>!scope.startsWith("sensitive:"));}
export function canAccessModule(actor:{role:Role;workScopes:readonly string[]},module:ModuleKey,_operation:"read"|"write"){
  if(actor.role!=="Staff")return true;
  return actor.workScopes.includes(module)&&(!["patients","dialysis"].includes(module)||actor.workScopes.includes(`sensitive:${module}`));
}
export function canManageRole(actor:Role,target:Role){return actor==="SystemAdmin"||actor==="UnitAdmin"&&target==="Staff"}

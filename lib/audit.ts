import type { D1Database } from "./db";
import { hospitalConfig } from "./config/runtime";
export function auditStatement(db:D1Database,input:{actorId:string;action:string;targetType:string;targetId?:string;detail?:Record<string,unknown>}){
  return db.prepare("INSERT INTO audit_log(id,hospital_id,actor_user_id,action,target_type,target_id,detail_json) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),hospitalConfig.identity.id,input.actorId,input.action,input.targetType,input.targetId??null,JSON.stringify(input.detail??{}));
}

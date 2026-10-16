import { MODULE_KEYS, type ModuleKey } from "@/config/schema";

export type FieldDefinition = { key: string; labelTh: string; type: "text"|"number"|"date"|"boolean"|"select"; required?: boolean; max?: number; min?: number; options?: readonly string[] };
export type ModuleDefinition = { labelTh: string; descriptionTh: string; scope: ModuleKey; statuses: readonly string[]; fields: readonly FieldDefinition[]; sensitive?: boolean };
const f=(key:string,labelTh:string,type:FieldDefinition["type"]="text",extra:Omit<FieldDefinition,"key"|"labelTh"|"type">={}):FieldDefinition=>({key,labelTh,type,...extra});

export const moduleCatalog:Record<ModuleKey,ModuleDefinition> = {
  sat:{labelTh:"ศูนย์บัญชาการเหตุการณ์",descriptionTh:"บันทึกเหตุการณ์ การตัดสินใจ และเจ้าของงาน",scope:"sat",statuses:["monitoring","activated","closed"],fields:[f("incidentName","ชื่อเหตุการณ์","text",{required:true,max:120}),f("severity","ระดับ","select",{required:true,options:["low","medium","high","critical"]}),f("commander","ผู้บัญชาการเหตุการณ์","text",{required:true,max:120})]},
  bcp:{labelTh:"แผนความต่อเนื่อง",descriptionTh:"ติดตามแผนบริการสำคัญและจุดกู้คืน",scope:"bcp",statuses:["ready","at-risk","activated","recovered"],fields:[f("service","บริการสำคัญ","text",{required:true,max:120}),f("owner","ผู้รับผิดชอบ","text",{required:true,max:120}),f("recoveryHours","เป้าหมายกู้คืน (ชั่วโมง)","number",{required:true,min:0,max:720})]},
  departmentReadiness:{labelTh:"ความพร้อมหน่วยงาน",descriptionTh:"ประเมินกำลังคน ระบบ และพื้นที่ของหน่วยงาน",scope:"departmentReadiness",statuses:["ready","limited","not-ready"],fields:[f("department","หน่วยงาน","text",{required:true,max:120}),f("staffAvailable","บุคลากรพร้อมงาน","number",{required:true,min:0,max:10000}),f("criticalGap","ช่องว่างสำคัญ","text",{max:500})]},
  wardCapacity:{labelTh:"เตียงและหอผู้ป่วย",descriptionTh:"รายงานเตียงที่ใช้งานและเตียงพร้อมรับ",scope:"wardCapacity",statuses:["normal","limited","full","evacuating"],fields:[f("ward","หอผู้ป่วย","text",{required:true,max:120}),f("operationalBeds","เตียงใช้งาน","number",{required:true,min:0,max:10000}),f("availableBeds","เตียงว่าง","number",{required:true,min:0,max:10000})]},
  stock:{labelTh:"คลังเวชภัณฑ์",descriptionTh:"ติดตามคงเหลือและระดับสั่งเติม",scope:"stock",statuses:["adequate","low","out","ordered"],fields:[f("item","รายการ","text",{required:true,max:160}),f("quantity","คงเหลือ","number",{required:true,min:0,max:100000000}),f("unit","หน่วยนับ","text",{required:true,max:40}),f("reorderLevel","ระดับสั่งเติม","number",{min:0,max:100000000})]},
  transport:{labelTh:"การขนส่ง",descriptionTh:"ติดตามยานพาหนะ เส้นทาง และความพร้อม",scope:"transport",statuses:["available","assigned","delayed","unavailable"],fields:[f("vehicle","ยานพาหนะ","text",{required:true,max:120}),f("route","เส้นทาง/ปลายทาง","text",{required:true,max:200}),f("driver","ผู้ขับ/ผู้ประสาน","text",{required:true,max:120})]},
  patients:{labelTh:"ผู้ป่วยที่ต้องติดตาม",descriptionTh:"ทะเบียนอ้างอิงขั้นต่ำเพื่อประสานภัยพิบัติ ไม่ใช่ EMR/HIS",scope:"patients",sensitive:true,statuses:["monitoring","transfer-needed","transferred","resolved"],fields:[f("referenceCode","รหัสอ้างอิง (ไม่ใช้เลขบัตรประชาชน)","text",{required:true,max:64}),f("careNeed","ความต้องการดูแล","text",{required:true,max:500}),f("legalBasis","ฐานกฎหมาย PDPA","select",{required:true,options:["consent","vital-interests","public-task","legal-obligation"]}),f("consentReference","หลักฐาน/เลขอ้างอิงการอนุญาตหรือการประเมินฐานกฎหมาย","text",{required:true,max:200})]},
  dialysis:{labelTh:"ความต่อเนื่องการฟอกไต",descriptionTh:"ประสานรอบฟอกไตในภาวะภัยพิบัติ ไม่ใช่เวชระเบียน",scope:"dialysis",sensitive:true,statuses:["scheduled","at-risk","relocated","completed"],fields:[f("patientReference","รหัสผู้ป่วยอ้างอิง","text",{required:true,max:64}),f("nextSessionDate","วันนัดถัดไป","date",{required:true}),f("modality","วิธีบำบัด","select",{required:true,options:["HD","PD","other"]}),f("legalBasis","ฐานกฎหมาย PDPA","select",{required:true,options:["consent","vital-interests","public-task","legal-obligation"]}),f("consentReference","หลักฐาน/เลขอ้างอิง","text",{required:true,max:200})]},
  recovery:{labelTh:"การฟื้นฟู",descriptionTh:"ติดตามความเสียหาย งานฟื้นฟู และกำหนดเสร็จ",scope:"recovery",statuses:["assessed","planned","in-progress","completed"],fields:[f("asset","พื้นที่/ทรัพย์สิน","text",{required:true,max:160}),f("action","งานฟื้นฟู","text",{required:true,max:500}),f("targetDate","กำหนดเสร็จ","date",{required:true})]},
  mission:{labelTh:"ภารกิจและการเบิกจ่าย",descriptionTh:"มอบหมายภารกิจและรายการทรัพยากรที่ต้องใช้",scope:"mission",statuses:["queued","assigned","in-progress","done","cancelled"],fields:[f("task","ภารกิจ","text",{required:true,max:300}),f("assignee","ผู้รับผิดชอบ","text",{required:true,max:120}),f("stockReference","รายการคลังที่เกี่ยวข้อง","text",{required:true,max:160})]},
};

export type ValidRecord={status:string;fields:Record<string,string|number|boolean>};
export type RecordValidation={ok:true;value:ValidRecord}|{ok:false;errors:string[]};
export function validateModuleRecord(module:ModuleKey,input:unknown):RecordValidation{
  if(!input||typeof input!=="object"||Array.isArray(input))return{ok:false,errors:["body must be an object"]};
  const raw=input as Record<string,unknown>,def=moduleCatalog[module],allowed=new Set(["status",...def.fields.map(x=>x.key)]),errors:string[]=[];
  for(const key of Object.keys(raw))if(!allowed.has(key))errors.push(`unknown field: ${key}`);
  if(typeof raw.status!=="string"||!(def.statuses as readonly string[]).includes(raw.status))errors.push("invalid status");
  const fields:Record<string,string|number|boolean>={};
  for(const field of def.fields){const v=raw[field.key];if(v===undefined||v===null||v===""){if(field.required)errors.push(`${field.key} is required`);continue}
    if(field.type==="number"){if(typeof v!=="number"||!Number.isFinite(v)||v<(field.min??-Infinity)||v>(field.max??Infinity))errors.push(`${field.key} is invalid`);else fields[field.key]=v}
    else if(field.type==="boolean"){if(typeof v!=="boolean")errors.push(`${field.key} is invalid`);else fields[field.key]=v}
    else if(typeof v!=="string"||v.length>(field.max??500)||field.type==="date"&&!/^\d{4}-\d{2}-\d{2}$/.test(v)||field.type==="select"&&!field.options?.includes(v))errors.push(`${field.key} is invalid`);else fields[field.key]=v;
  }
  return errors.length?{ok:false,errors}:{ok:true,value:{status:raw.status as string,fields}};
}
export function isModuleKey(value:string):value is ModuleKey{return (MODULE_KEYS as readonly string[]).includes(value)}

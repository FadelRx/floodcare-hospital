import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const roots=["app","config","db","docs","lib","migrations","public","scripts"];
async function files(dir:string):Promise<string[]>{try{return (await readdir(dir,{withFileTypes:true})).flatMap(e=>e.isDirectory()?[]:[path.join(dir,e.name)])}catch{return[]}}
async function walk(dir:string):Promise<string[]>{let out:string[]=[];try{for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);out.push(...(e.isDirectory()?await walk(p):[p]))}}catch{}return out}
test("publication contains no source profiles, production domain, secrets, or regional routes",async()=>{
  const all=(await Promise.all(roots.map(walk))).flat().filter(f=>!f.endsWith(".png"));
  const forbidden=[new RegExp("pat"+"tani","i"),new RegExp("ya"+"la","i"),new RegExp("floodcare-"+"tani\\.com","i"),new RegExp("/api/(?:net"+"work|regional)","i"),new RegExp("public-"+"flags","i"),/password\s*[=:]\s*["'][^"']+/i,new RegExp("sk_"+"live_[a-z0-9]+","i")];
  for(const file of all){const text=await readFile(file,"utf8");for(const pattern of forbidden)assert.equal(pattern.test(text),false,`${file} contains ${pattern}`)}
});
test("baseline contains no bootstrap users or patient/demo inserts",async()=>{const sql=await readFile("migrations/0000_baseline.sql","utf8");assert.equal(/insert\s+into\s+(?:users|patient_records)/i.test(sql),false);assert.equal(/demo|seed.*account/i.test(sql),false)});
test("auth API scopes lookup with configured hospital rather than client hospital id",async()=>{const route=await readFile("app/api/auth/login/route.ts","utf8");assert.match(route,/hospitalConfig\.identity\.id/);assert.doesNotMatch(route,/body\.(?:hospital|org)/)});

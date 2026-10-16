import { spawnSync } from "node:child_process";
import process from "node:process";
if(process.argv.includes("--plan")){console.log("Plan: doctor -> build -> wrangler deploy. No action taken.");process.exit(0)}
if(!process.argv.includes("--confirm")){console.error("Deployment requires explicit --confirm after reviewing docs/DEPLOY-CLOUDFLARE.md");process.exit(2)}
for(const [cmd,args] of [["npm",["run","doctor"]],["npm",["run","build"]],["npx",["wrangler","deploy"]]]){const executable=process.platform==="win32"?`${cmd}.cmd`:cmd;const r=spawnSync(executable,args,{stdio:"inherit"});if(r.status)process.exit(r.status)}

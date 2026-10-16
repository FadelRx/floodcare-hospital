import { readdir,readFile } from "node:fs/promises";
import path from "node:path";
const roots=["app","config","lib","scripts","tests"],errors=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())await walk(file);else if(/\.(?:ts|tsx|mjs)$/.test(file)){const text=await readFile(file,"utf8");if(text.includes("\t"))errors.push(`${file}: tab character`);if(/[ \t]+$/m.test(text))errors.push(`${file}: trailing whitespace`)}}}
for(const root of roots)await walk(root);if(errors.length){console.error(errors.join("\n"));process.exit(1)}console.log("Lint checks passed.");

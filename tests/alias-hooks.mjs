// resolver ให้ node --test เข้าใจ path alias "@/..." เดียวกับ tsconfig paths
// (Next/webpack ใช้ alias นี้อยู่แล้ว — ตัวรันเทสต์และสคริปต์ใน scripts/ จึงต้องแปลงให้ตรงกัน)
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);
const EXTS = ["", ".ts", ".tsx", ".mjs", ".js", "/index.ts", "/index.tsx"];

/** true เฉพาะเมื่อเป็น "ไฟล์" จริง — โฟลเดอร์ต้องเดินต่อไปหา /index.ts */
function isFile(url) {
  try {
    return statSync(fileURLToPath(url)).isFile();
  } catch {
    return false;
  }
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const rest = specifier.slice(2);
    for (const ext of EXTS) {
      const url = new URL(rest + ext, ROOT);
      if (isFile(url)) return next(url.href, context);
    }
  }
  // TypeScript เขียน import แบบไม่มีนามสกุลได้ ("./schema") — เติมให้เอง
  if (specifier.startsWith(".") && context.parentURL?.startsWith(ROOT.href)) {
    for (const ext of EXTS) {
      const url = new URL(specifier + ext, context.parentURL);
      if (!isFile(url)) continue;
      // import ไฟล์ .json แบบ bundler (ไม่มี with { type: "json" }) — node บังคับ attribute
      if (url.pathname.endsWith(".json")) {
        const r = await next(url.href, context);
        return { ...r, importAttributes: { ...r.importAttributes, type: "json" } };
      }
      return next(url.href, context);
    }
  }
  return next(specifier, context);
}

/**
 * บอก node ตรง ๆ ว่าไฟล์ .ts ของโปรเจกต์นี้เป็น ES module
 * (ไม่งั้น node จะเตือน MODULE_TYPELESS_PACKAGE_JSON แล้วพาร์สซ้ำสองรอบ
 *  ทางแก้อีกทางคือใส่ "type": "module" ใน package.json ซึ่งจะกระทบ runtime ของ Next)
 */
export async function load(url, context, next) {
  if (url.startsWith(ROOT.href) && /\.tsx?$/.test(url) && !url.includes("/node_modules/")) {
    return next(url, { ...context, format: "module-typescript" });
  }
  return next(url, context);
}

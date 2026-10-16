import Link from "next/link";
import { hospitalConfig } from "@/lib/config/runtime";
export default function Home(){return <main className="wrap"><div className="card"><h1>{hospitalConfig.branding.appName}</h1><p>ระบบเตรียมพร้อมและบริหารภาวะภัยพิบัติสำหรับโรงพยาบาลแห่งเดียว</p><p className="notice">การตั้งค่ายังเป็นค่าตัวอย่าง โปรดเรียก <code>npm run setup</code> ก่อนใช้งานจริง</p><Link className="button" href="/login">เข้าสู่ระบบ</Link></div><p className="muted">FloodCare Hospital — พัฒนาเริ่มต้นโดย FadelRx ภายใต้ Apache License 2.0</p></main>}

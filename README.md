# FloodCare Hospital 0.1.0-alpha

**FloodCare Hospital** คือระบบเตรียมพร้อมรับมือภัยน้ำท่วมสำหรับ **โรงพยาบาลเดี่ยว (single-hospital)** ที่รันบน **Cloudflare Workers + D1** ออกแบบมาให้โรงพยาบาล clone ไปตั้งค่าเองและ deploy บนบัญชี Cloudflare ของตัวเอง โดยไม่ผูกกับเครือข่ายหรือหน่วยงานใด

> ⚠️ **สถานะ: Alpha (รุ่นทดลอง)** — ยังไม่ใช่ระบบ EMR/HIS ไม่ใช่ระบบช่วยตัดสินใจทางคลินิก ไม่ใช่เครือข่ายระดับภูมิภาค และยังไม่พร้อมใช้ production จริงโดยไม่ทดสอบเพิ่มเติม

## สิ่งที่มีในรุ่นนี้

- **ยืนยันตัวตนในระบบ (Local auth)** — บัญชีผู้ใช้+รหัสผ่านในระบบ มี rate limiting ระดับบัญชีและ IP, session ถูกเพิกถอนได้ (revoke) พร้อม audit log
- **เปิด/ปิดโมดูลได้ขณะรันระบบ** — โมดูลที่ติดตั้งใน config คือเพดานสูงสุด, ตาราง D1 `module_settings` กำหนดชุดที่เปิดใช้จริง (ค่าที่หายไป fallback เป็นค่า default จาก config)
- **สิทธิ์แบบ 3 ระดับ** — `SystemAdmin` ดูแลผู้ใช้ทุกคน, `UnitAdmin` ดูแลได้เฉพาะ `Staff`, `Staff` เห็นเฉพาะงานที่ได้รับมอบหมาย (work scopes)
- **บันทึกประจำวัน 10 โมดูล** แต่ละโมดูลมีป้ายภาษาไทย สถานะเป็นของตัวเอง schema ตรวจที่ฝั่ง server และหน้าจอสร้าง/ดูรายการ:
  1. สถานการณ์/ศูนย์ปฏิบัติการ (Incident command)
  2. แผนความต่อเนื่อง (BCP)
  3. ความพร้อมหน่วยงาน (Department readiness)
  4. ความจุเตียง/ตึกผู้ป่วย (Ward capacity)
  5. คลังวัสดุ-ยุทโธปกรณ์ (Stock)
  6. การขนส่ง (Transport)
  7. ประสานงานผู้ป่วย (Patient coordination)
  8. ความต่อเนื่องฟอกไต (Dialysis continuity)
  9. ฟื้นฟูซ่อมแซม (Recovery)
  10. ภารกิจ/หน่วยแพทย์เคลื่อนที่ (Missions)

### โมดูลผู้ป่วยและฟอกไต (PDPA)

โมดูล **Patient coordination** และ **Dialysis** เก็บเฉพาะข้อมูลอ้างอิง/ข้อมูลน้อยที่สุดเพื่อการประสานงาน โดยมีเงื่อนไขบังคับ:

- ต้องระบุ **ฐานทางกฎหมาย (PDPA legal basis)** และ **เอกสารอ้างอิงความยินยอม** ทุกครั้ง
- Staff ต้องได้รับ scope `sensitive:*` แบบระบุชัดเจนจึงจะเข้าถึงได้
- การอ่าน/เขียนทุกครั้งถูกบันทึก audit log
- **ห้ามกรอกเลขบัตรประชาชน (CID)** — ระบบไม่มีช่องเก็บและไม่รับข้อมูลนี้

## เริ่มใช้งาน (Quick start)

```sh
npm ci
npm run setup
npm run db:migrate:local
npm run db:bootstrap:local
npm run account:issue -- --username=admin --role=SystemAdmin
npm run dev
```

ขั้นตอนคร่าว ๆ:

1. ติดตั้ง **Node.js 22.18+** แล้ว `npm ci`
2. รัน `npm run setup` — ถามข้อมูลตัวตน รพ., ที่ตั้ง (พิกัด lat/lon), และเลือกโมดูลที่ต้องการ (**ไม่มีการถามหรือเขียน secret ใด ๆ**) หรือใช้โหมด non-interactive ดูรายละเอียดใน [docs/INSTALL.md](docs/INSTALL.md)
3. ตรวจทาน `config/hospital.config.ts` ที่ setup สร้างให้
4. `npm run db:migrate:local` + `npm run db:bootstrap:local` — สร้าง schema และใส่เฉพาะข้อมูล รพ.+สถานะโมดูล
5. ออกบัญชีผู้ดูแลคนแรกด้วย `npm run account:issue` แล้ว `npm run dev`

## การค้นหาแหล่งข้อมูลน้ำ/กล้องใกล้โรงพยาบาล

ระบบรองรับการ **เสนอรายชื่อสถานีวัดน้ำ/กล้อง CCTV ใกล้พิกัดของโรงพยาบาล** (ThaiWater, ปภ. DDPM, โทรมาตร กฟผ./ irrigation Telerid) โดยมีกติกาปลอดภัยชัดเจน:

- ค้นหาเฉพาะเมื่อ **ระบุ flag อย่างชัดเจน** (`--discover-nearby` + registry URL/source)
- ผลลัพธ์เก็บเป็นสถานะ **`unconfirmed`** สูงสุด 10 รายการ พร้อมคะแนนจัดอันดับ
- ระบบ **ไม่มีวันยืนยัน** ทิศทางแม่น้ำ/ต้นน้ำเองอัตโนมัติ — ต้องให้ผู้ดูแลยืนยันเองเสมอ

## Deploy ขึ้น Cloudflare

ดูคู่มือฉบับเต็มที่ [docs/DEPLOY-CLOUDFLARE.md](docs/DEPLOY-CLOUDFLARE.md)

สรุป: สร้างฐานข้อมูล D1 → คัดลอก `wrangler.example.jsonc` เป็น config ของคุณแล้วแทน database UUID → เก็บ `AUTH_SECRET` ด้วย `wrangler secret put AUTH_SECRET` (ห้ามใส่ในไฟล์ JSON/สคริปต์) → รัน migration และ bootstrap ฝั่ง remote → ออกบัญชี admin คนแรก → ตรวจด้วย `npm run doctor` → deploy ด้วย `npm run deploy -- --confirm`

## ข้อจำกัดของรุ่น Alpha

- มีเฉพาะ workflow **สร้าง/ดูรายการ** — ยังไม่มีแก้ไข/ลบ, ไฟล์แนบ, offline sync, conflict resolution
- ไม่มีการซิงก์ข้อมูลกับ EMR/HIS และไม่มีการตรวจสอบข้อมูลระดับคลินิก
- D1 เข้ารหัสข้อมูลขณะพัก (encryption at rest) ให้โดยแพลตฟอร์ม — ระบบ **ไม่อวดอ้าง** การเข้ารหัสระดับ field ในแอปพลิเคชัน
- โครงสร้างถูกตั้งเป็น template ที่ไม่ deploy ได้จนกว่าจะรัน setup — ไม่มี secret หรือข้อมูลจริงฝังใน repo

## เอกสารเพิ่มเติม

- [docs/INSTALL.md](docs/INSTALL.md) — ติดตั้งและตั้งค่าเริ่มต้น
- [docs/DEPLOY-CLOUDFLARE.md](docs/DEPLOY-CLOUDFLARE.md) — deploy ขึ้น Cloudflare Workers/D1
- [docs/PDPA.md](docs/PDPA.md) — การใช้งานโมดูลผู้ป่วย/ฟอกไตอย่างถูกหลัก PDPA

## สัญญาอนุญาตและที่มา

เผยแพร่ภายใต้ **Apache License 2.0** (ดู [LICENSE](LICENSE) และ [NOTICE](NOTICE))

FloodCare Hospital พัฒนาเริ่มต้นโดย [FadelRx](https://github.com/FadelRx) เพื่อใช้ในเครือข่ายเตรียมพร้อมภัยพิบัติโรงพยาบาล ทุกการติดตั้งดำเนินการและรับผิดชอบข้อมูลของตนเอง — การ deploy ใด ๆ ไม่ใช่การอ้างว่าเป็นระบบทางการของหน่วยงานอื่น

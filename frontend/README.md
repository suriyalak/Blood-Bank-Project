# 🩸 Blood Bank Management System - Frontend

ส่วนแสดงผลหน้าเว็บ (Frontend) ของระบบบริหารจัดการคลังเลือด พัฒนาด้วย **React (Vite)** เชื่อมต่อข้อมูลการทำ CRUD คลังเลือดกับ **Supabase REST API** โดยตรง และเชื่อมต่อกับ **FastAPI Backend** สำหรับฟีเจอร์ประมวลผลพิเศษ

---

## 🛠️ Tech Stack & Dependencies

- **Core Framework:** React (Vite)
- **Database Client:** `@supabase/supabase-js`
- **State & Router:** React Router DOM (ถ้ามี)
- **HTTP Client:** Fetch API / Axios

---

## ⚙️ Environment Variables Setup

สร้างไฟล์ `.env` ไว้ที่โฟลเดอร์ `frontend/` โดยระบุค่าดังนี้:

```env
VITE_SUPABASE_URL=https://hdfzmgabkyomskifgvli.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_r3BE5gt0BBSLS2Pz-uVniA_h14899Sl
VITE_API_BASE_URL=http://127.0.0.1:8000
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
VITE_API_URL=[https://blood-bank-project-svji.onrender.com](https://blood-bank-project-svji.onrender.com)
VITE_SUPABASE_URL=https://<your-supabase-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
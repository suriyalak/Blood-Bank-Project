# 🩸 Blood Bank Management System - Backend API

ส่วนประมวลผลหลังบ้าน (Backend API) ของระบบบริหารจัดการคลังเลือด พัฒนาด้วย **FastAPI (Python 3.11)** ให้บริการ RESTful API สำหรับระบบตรวจสอบสิทธิ์ผู้ใช้งาน (Authentication), การประมวลผลเชิงวิเคราะห์ข้อมูล (ML/Analytics) และเชื่อมต่อกับฐานข้อมูล Supabase PostgreSQL

---

## 🛠️ Tech Stack & Dependencies

- **Framework:** FastAPI
- **Server:** Uvicorn
- **Authentication:** `python-jose[cryptography]`, `passlib[bcrypt]`
- **Validation:** `pydantic`, `email-validator`
- **Database & ORM:** `supabase`, `sqlalchemy`, `psycopg2-binary`
- **Data Science & ML:** `pandas`, `scikit-learn`

---

## ⚙️ Environment Variables Setup

สร้างไฟล์ `.env` ไว้ที่โฟลเดอร์ `backend/` โดยระบุค่าดังนี้:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<dbname>
SUPABASE_URL=https://<your-supabase-project-id>.supabase.co
SUPABASE_KEY=<your-supabase-service-role-key>
SECRET_KEY=<your-jwt-secret-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
# 🩸 Blood Inventory Management System

ระบบบริหารจัดการคลังเลือดแบบ Full-Stack พัฒนาด้วย **React (Vite)** ในส่วนของ Frontend, **FastAPI (Python 3.11)** ในส่วนของ Backend และใช้ **Supabase** เป็นระบบจัดการฐานข้อมูลหลัก

---

## 🚀 Live Services

- **Frontend (Vercel):** [https://blood-bank-project-one.vercel.app](https://blood-bank-project-one.vercel.app)
- **Backend API (Render):** [https://blood-bank-project-svji.onrender.com](https://blood-bank-project-svji.onrender.com)
- **API Documentation (Swagger UI):** [https://blood-bank-project-svji.onrender.com/docs](https://blood-bank-project-svji.onrender.com/docs)
- **GitHub Repository:** [https://github.com/suriyalak/Blood-Bank-Project](https://github.com/suriyalak/Blood-Bank-Project)

---

## 🛠️ System Architecture

### 🏗️ Data Flow & Architecture
- **Frontend (Vercel):** รับหน้าที่จัดการ UI/UX และดึง/เพิ่ม/แก้ไขข้อมูลคลังเลือด (`blood_inventory`) กับ **Supabase REST API** โดยตรงเพื่อความรวดเร็ว
- **Backend (Render):** ให้บริการ RESTful API ด้วย FastAPI สำหรับระบบตรวจสอบสิทธิ์ผู้ใช้งาน (JWT Authentication), การ Validate ข้อมูลด้วย Pydantic และการประมวลผลเชิงวิเคราะห์/Machine Learning
- **Database (Supabase):** เก็บข้อมูลถุงเลือด, บัญชีผู้ใช้งาน, ข้อมูลโรงพยาบาล และประวัติรายการต่างๆ ในฐานข้อมูล PostgreSQL

### 💻 Technology Stack

| Part | Technology | Description |
|---|---|---|
| **Frontend** | React (Vite) | Single Page Application (SPA) ประสิทธิภาพสูง |
| **Backend** | FastAPI (Python 3.11) | High-performance Web Framework สำหรับ REST API |
| **Database** | Supabase (PostgreSQL) | Cloud Database พร้อมระบบ RLS และ Real-time |
| **Authentication** | `python-jose`, `passlib` | จัดการ JWT Token และ Hash Password ด้วย bcrypt |
| **Data & ML** | `pandas`, `scikit-learn` | ประมวลผลและวิเคราะห์ข้อมูลคลังเลือด |
| **Validation** | `pydantic`, `email-validator` | ตรวจสอบ Schema ของข้อมูลและรูปแบบอีเมล |

---

## 📁 Project Structure

```text
Blood-Bank-Project/
├── backend/                  # FastAPI Backend Application
│   ├── main.py               # API endpoints & application logic
│   ├── database.py           # Database connections
│   ├── requirements.txt      # Python package dependencies
│   └── .env.example          # Backend environment variables guide
├── frontend/                 # React Vite Frontend Application
│   ├── src/                  # React components, pages & Supabase client
│   ├── package.json          # Node.js dependencies
│   └── .env.example          # Frontend environment variables guide
└── README.md                 # Project documentation
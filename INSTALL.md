# 🛠️ Blood Bank Management System - Installation & Setup Guide

คู่มือฉบับเต็มสำหรับการติดตั้ง ตั้งค่า และปรับแต่งระบบบริหารจัดการคลังเลือด (Blood Bank Management System) ทั้งสำหรับการรันบนเครื่อง Local และการนำขึ้นระบบ Production (Cloud Deployment)

---

## 📋 สารบัญ

1. [สิ่งที่ต้องเตรียมก่อนเริ่ม (Prerequisites)](#1-สิ่งที่ต้องเตรียมก่อนเริ่ม-prerequisites)
2. [การตั้งค่าฐานข้อมูล (Supabase Setup)](#2-การตั้งค่าฐานข้อมูล-supabase-setup)
3. [การติดตั้งบนเครื่อง Local (Local Development)](#3-การติดตั้งบนเครื่อง-local-local-development)
   - [3.1 Backend Setup (FastAPI)](#31-backend-setup-fastapi)
   - [3.2 Frontend Setup (React Vite)](#32-frontend-setup-react-vite)
4. [ตาราง Environment Variables](#4-ตาราง-environment-variables)
5. [การ Deploy ขึ้นระบบ Cloud (Production Setup)](#5-การ-deploy-ขึ้นระบบ-cloud-production-setup)
   - [5.1 Deploy Backend บน Render](#51-deploy-backend-บน-render)
   - [5.2 Deploy Frontend บน Vercel](#52-deploy-frontend-บน-vercel)
6. [ข้อควรระวังและการแก้ไขปัญหา (Troubleshooting)](#6-ข้อควรระวังและการแก้ไขปัญหา-troubleshooting)

---

## 1. สิ่งที่ต้องเตรียมก่อนเริ่ม (Prerequisites)

ก่อนเริ่มการติดตั้ง กรุณาตรวจสอบว่าในเครื่องของคุณมีโปรแกรมและเครื่องมือต่อไปนี้พร้อมใช้งาน:

- **Git:** เวอร์ชันล่าสุดสำหรับ Clone Repository
- **Python:** เวอร์ชัน **3.11.x** (แนะนำ 3.11.8)
- **Node.js:** เวอร์ชัน **18.x** ขึ้นไป พร้อม `npm`
- **Code Editor:** Visual Studio Code (แนะนำ)
- **Accounts:**
  - บัญชี [Supabase](https://supabase.com/) (สำหรับ Database & Storage)
  - บัญชี [Render](https://render.com/) (สำหรับ Hosting Backend)
  - บัญชี [Vercel](https://vercel.com/) (สำหรับ Hosting Frontend)

---

## 2. การตั้งค่าฐานข้อมูล (Supabase Setup)

1. เข้าสู่ระบบ [Supabase Dashboard](https://supabase.com/dashboard) แล้วกด **New Project**
2. ตั้งชื่อโปรเจกต์และกำหนดรหัสผ่านฐานข้อมูล (Database Password)
3. เมื่อสร้างโปรเจกต์เสร็จแล้ว ให้ไปที่ **Project Settings** -> **API** และบันทึกค่าต่อไปนี้:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`
4. ไปที่ **Project Settings** -> **Database** แล้วคัดลอก **URI Connection String** (`DATABASE_URL`)
5. ไปที่เมนู **SQL Editor** เพื่อรันสคริปต์สร้างตารางหลัก เช่น:
   - `blood_inventory` (ตารางจัดเก็บข้อมูลถุงเลือด)
   - `hospitals` (ตารางโรงพยาบาล/หน่วยงาน)
   - `regions`, `provinces`, `districts` (ตารางพื้นที่บริหารจัดการ)
6. ตั้งค่า **Row Level Security (RLS)** และกำหนด Policies สิทธิ์การอ่าน/เขียน (SELECT, INSERT, UPDATE, DELETE) ให้เหมาะสม

---

## 3. การติดตั้งบนเครื่อง Local (Local Development)

### 3.1 Clone Project
```bash
git clone https://github.com/suriyalak/Blood-Bank-Project.git
cd Blood-Bank-Project
```

---

### 3.2 Backend Setup (FastAPI)

1. เข้าไปยังโฟลเดอร์ `backend`:
   ```bash
   cd backend
   ```

2. สร้างและเปิดใช้งาน Python Virtual Environment:
   - **Windows (Command Prompt / PowerShell):**
     ```cmd
     python -m venv .venv
     .venv\Scripts\activate
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. สร้างไฟล์ `.env` ไว้ที่โฟลเดอร์ `backend/` แล้วใส่ข้อมูลดังนี้:
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   SUPABASE_URL=https://[PROJECT-ID].supabase.co
   SUPABASE_KEY=[YOUR-SUPABASE-SERVICE-ROLE-KEY]
   SECRET_KEY=[YOUR-CUSTOM-JWT-SECRET-KEY]
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

4. ติดตั้ง Python Package Dependencies:
   ```bash
   pip install --upgrade pip setuptools wheel
   pip install -r requirements.txt
   ```

5. สั่งรัน Backend Server:
   ```bash
   uvicorn main:app --reload
   ```
   - Backend จะทำงานอยู่ที่: `http://localhost:8000`
   - ทดสอบเอกสาร API ได้ที่: `http://localhost:8000/docs`

---

### 3.3 Frontend Setup (React Vite)

1. เปิด Terminal ใหม่แล้วเข้าไปยังโฟลเดอร์ `frontend`:
   ```bash
   cd frontend
   ```

2. สร้างไฟล์ `.env` ไว้ที่โฟลเดอร์ `frontend/` แล้วใส่ข้อมูลดังนี้:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_SUPABASE_URL=https://[PROJECT-ID].supabase.co
   VITE_SUPABASE_ANON_KEY=[YOUR-SUPABASE-ANON-KEY]
   ```

3. ติดตั้ง Node.js Modules:
   ```bash
   npm install
   ```

4. สั่งรัน Development Server:
   ```bash
   npm run dev
   ```
   - หน้าเว็บจะทำงานอยู่ที่: `http://localhost:5173`

---

## 4. ตาราง Environment Variables

### Backend (`backend/.env`)

| Variable Name | Description | Example / Note |
|---|---|---|
| `DATABASE_URL` | Connection String สำหรับ PostgreSQL บน Supabase | `postgresql://user:pass@host:5432/postgres` |
| `SUPABASE_URL` | URL ประจำตัวโปรเจกต์ Supabase | `https://xxxx.supabase.co` |
| `SUPABASE_KEY` | Service Role Key (ใช้จัดการสิทธิ์หลังบ้าน) | `eyJhbGciOi...` (ห้ามหลุดสู่ Public) |
| `SECRET_KEY` | คีย์สำหรับตักรหัส/ถอดรหัส JWT Token | สุ่มสีกระดาษรหัสผ่านความยาวอย่างน้อย 32 ตัวอักษร |
| `ALGORITHM` | อัลกอริทึมเข้ารหัส JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | อายุของ Token (นาที) | `30` หรือ `60` |

### Frontend (`frontend/.env`)

| Variable Name | Description | Example / Note |
|---|---|---|
| `VITE_API_URL` | URL ของ FastAPI Backend | Local: `http://localhost:8000`<br>Production: `https://xxx.onrender.com` |
| `VITE_SUPABASE_URL` | URL ประจำตัวโปรเจกต์ Supabase | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Public Anon Key ของ Supabase | `eyJhbGciOi...` |

---

## 5. การ Deploy ขึ้นระบบ Cloud (Production Setup)

### 5.1 Deploy Backend บน Render

1. สมัคร/เข้าสู่ระบบ [Render](https://render.com/) และสร้าง **New Web Service**
2. เชื่อมต่อกับ GitHub Repository `Blood-Bank-Project`
3. กำหนดค่าต่างๆ ดังนี้:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** 
     ```bash
     pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
     ```
   - **Start Command:** 
     ```bash
     uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
4. ไปที่หัวข้อ **Environment Variables** แล้วใส่ค่าคีย์ทั้งหมดตามตารางของ Backend

---

### 5.2 Deploy Frontend บน Vercel

1. สมัคร/เข้าสู่ระบบ [Vercel](https://vercel.com/) และกด **Add New...** -> **Project**
2. เลือก Import จาก Repository `Blood-Bank-Project`
3. ตั้งค่าการ Build:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. เพิ่มค่า **Environment Variables** ของ Frontend (`VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
5. กด **Deploy**

> **⚠️ ข้อสำคัญ:** หากมีการแก้ไขค่า `VITE_API_URL` ใน Environment Variables ของ Vercel ภายหลัง ให้กดปุ่ม **Redeploy** เสมอ เพื่อให้ Vite บิวด์ค่าใหม่เข้าไปในโค้ดฝั่ง Client

---

## 6. ข้อควรระวังและการแก้ไขปัญหา (Troubleshooting)

1. **Render Cold Start (Delay 30-50 วินาที):**
   - เนื่องจาก Render Free Tier จะปิดการทำงานชั่วคราวเมื่อไม่มี Traffic เกิน 15 นาที การยิง API ครั้งแรกอาจต้องรอเซิร์ฟเวอร์ Spin up สักครู่
2. **CORS Error บน Browser:**
   - หากเจอข้อผิดพลาด CORS ให้ตรวจสอบไฟล์ `backend/main.py` ว่าได้เพิ่มโดเมนของ Vercel เข้าไปใน `CORSMiddleware` เรียบร้อยแล้วหรือไม่
3. **GitHub Push Protection บล็อกการยิง Commit:**
   - หากเผลอหลุดใส่ Secret Key จริงลงในไฟล์ เช่น `README.md` หรือโค้ด ให้แก้ไฟล์ ลบ Secret ออก ทำการ `git commit --amend` หรือทำขั้นตอน Unblock ผ่านลิงก์ของ GitHub Security
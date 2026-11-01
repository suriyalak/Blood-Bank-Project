import os
from datetime import datetime, timedelta, timezone, date
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from dotenv import load_dotenv
from jose import JWTError, jwt
import bcrypt

# โหลดค่า Environment Variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://sxufilpozwqfhjhhwvxo.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_sAhfJtEaSv4T08NZFXj44A_aB0txngO")

# เชื่อมต่อ Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(
    title="PK Blood Bank Enterprise API", 
    description="API สำหรับระบบบริหารจัดการคลังเลือดระดับภูมิภาค รองรับระบบหลายโรงพยาบาล",
    version="2.0.0"
)

# ตั้งค่า CORS Middleware ให้รองรับหน้าบ้าน React อย่างถูกต้องและปลอดภัย
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ตั้งค่าระบบความปลอดภัย (Security Configuration) ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "SUPER_SECRET_KEY_FOR_BLOOD_BANK_PROJECT_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480 # ตั๋วมีอายุใช้งาน 8 ชั่วโมง (1 กะการทำงานพอดี)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v2/auth/login")

# --- Pydantic Models สำหรับ Authentication ---
class UserRegisterSchema(BaseModel):
    User_ID: str
    Username: str
    Password: str
    Fullname: str
    Email: EmailStr
    Department: str
    Hospital_ID: str

# เพิ่ม Schema
class StatusUpdate(BaseModel):
    status: str

class UserLoginSchema(BaseModel):
    Username: str
    Password: str

class TokenSchema(BaseModel):
    access_token: str
    token_type: str
    user: dict

# --- ฟังก์ชันช่วย (Helper Functions) ---
def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- Dependency สำหรับดึงข้อมูล User ปัจจุบันจาก Token ---
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="ไม่สามารถตรวจสอบสิทธิ์การเข้าใช้งานได้ หรือ Token หมดอายุ",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user_res = supabase.table("users").select("*, hospitals(hospital_name)").eq("username", username).execute()
    if not user_res.data:
        raise credentials_exception
    return user_res.data[0]

# --- Pydantic Schemas สำหรับระบบคลังเลือด ---
class BloodInventoryCreate(BaseModel):
    Inventory_ID: Optional[str] = None
    Hospital_ID: Optional[str] = "HOSP001"
    Unit_No: Optional[str] = None
    Record_date: Optional[date] = None
    Expiry_date: Optional[date] = None
    Status: Optional[str] = "AVAILABLE" 
    Group: Optional[str] = None  
    blood_type: Optional[str] = None
    Rh_ID: Optional[str] = "RH+"
    Component_ID: Optional[str] = "COMP01"
    User_ID: Optional[str] = None

class BloodTransactionCreate(BaseModel):
    transaction_type: str = "INBOUND" # INBOUND หรือ OUTBOUND
    blood_type: str = "O+"
    quantity_bags: int = 1
    donor_patient_name: str
    remarks: Optional[str] = ""
    Inventory_ID: Optional[str] = None
    User_ID: Optional[str] = None
    Hospital_ID: Optional[str] = "HOSP001"

# =================================================================
# 🛣️ API Endpoints
# =================================================================

@app.get("/")
def root():
    return {"status": "Online", "database": "Supabase Connected", "version": "2.0.0"}

# --- 1. กลุ่ม API ข้อมูลคลังเลือด (Blood Inventory) ---

# รองรับทัังพาสสั้น /api/... และพาสเวอร์ชันใหม่ /api/v2/... ป้องกันหน้าบ้าน 404
@app.get("/api/v2/blood/inventory")
@app.get("/api/blood/inventory")
def get_all_inventory(hospital_id: Optional[str] = None, status: Optional[str] = None):
    try:
        query = supabase.table("blood_inventory").select(
            "*, hospitals(hospital_name), standard_blood_components(component_name), standard_rh_groups(rh_name), users(fullname)"
        )
        
        if hospital_id:
            query = query.eq("hospital_id", hospital_id)
        if status:
            query = query.eq("status", status)
            
        response = query.order("record_date", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

@app.post("/api/v2/blood/inventory")
@app.post("/api/blood/inventory")
def add_blood_to_inventory(payload: BloodInventoryCreate, current_user: dict = Depends(get_current_user)):
    try:
        current_uid = current_user.get("user_id") or current_user.get("User_ID")

        check_exist = supabase.table("blood_inventory").select("inventory_id").eq("unit_no", payload.Unit_No).execute()
        if check_exist.data:
            raise HTTPException(status_code=400, detail=f"หมายเลขถุงเลือด {payload.Unit_No} มีอยู่ในระบบแล้ว")

        data_to_insert = {
            "inventory_id": payload.Inventory_ID,
            "hospital_id": payload.Hospital_ID,
            "unit_no": payload.Unit_No,
            "record_date": str(payload.Record_date),
            "expiry_date": str(payload.Expiry_date),
            "status": payload.Status,
            "group": payload.Group,
            "rh_id": payload.Rh_ID,
            "component_id": payload.Component_ID,
            "user_id": current_uid
        }

        response = supabase.table("blood_inventory").insert(data_to_insert).execute()
        fullname = current_user.get("fullname") or current_user.get("Fullname", "เจ้าหน้าที่")
        return {"success": True, "message": f"ลงทะเบียนถุงเลือดสำเร็จ โดยเจ้าหน้าที่: {fullname}", "data": response.data}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/v2/blood/inventory/{inventory_id}/status")
@app.put("/api/blood/inventory/{inventory_id}/status")
def update_blood_status(inventory_id: str, payload: StatusUpdate, current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("blood_inventory").update({"status": payload.Status}).eq("inventory_id", inventory_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="ไม่พบรหัสถุงเลือดที่ระบุในคลัง")
        fullname = current_user.get("fullname") or current_user.get("Fullname", "เจ้าหน้าที่")
        return {"success": True, "message": f"เจ้าหน้าที่ {fullname} อัปเดตสถานะเป็น {payload.Status} เรียบร้อย"}
    except HTTPException as he:
        # แยกให้ออกไปตรงๆ ไม่ให้โดน Exception ด้านล่างดักจับครอบงำพาสส์สเตตัสผิดพลาด
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- เพิ่มเติม: Endpoint สำหรับประวัติการทำรายการ (Transactions) ป้องกันหน้าบ้านพังหน้าขาว ---
# --- เพิ่มเติม: Endpoint บันทึกธุรกรรมเลือด (Transactions) ---
@app.post("/api/v2/blood/transactions")
@app.post("/api/blood/transactions")
def add_blood_transaction(payload: BloodTransactionCreate, current_user: dict = Depends(get_current_user)):
    try:
        current_uid = current_user.get("user_id") or current_user.get("User_ID") or payload.User_ID or "SYSTEM"
        hospital_id = current_user.get("hospital_id") or payload.Hospital_ID or "HOSP001"

        # สั่งบันทึกลงตาราง blood_inventory ที่มีอยู่แล้วใน Supabase
        data_to_insert = {
            "inventory_id": f"INV-{int(datetime.now().timestamp())}",
            "hospital_id": hospital_id,
            "unit_no": f"UNIT-{int(datetime.now().timestamp())}",
            "record_date": str(date.today()),
            "expiry_date": str(date.today() + timedelta(days=35)),
            "status": "AVAILABLE" if payload.transaction_type == "INBOUND" else "DISPENSED",
            "group": payload.blood_type,
            "rh_id": "RH+",
            "component_id": "COMP01",
            "user_id": current_uid
        }

        response = supabase.table("blood_inventory").insert(data_to_insert).execute()
        return {"success": True, "message": "บันทึกข้อมูลเรียบร้อยแล้ว", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v2/blood/inventory")
@app.post("/api/blood/inventory")
def add_blood_to_inventory(payload: BloodInventoryCreate, current_user: dict = Depends(get_current_user)):
    try:
        current_uid = current_user.get("user_id") or current_user.get("User_ID") or payload.User_ID or "SYSTEM"
        unit_no = payload.Unit_No or f"UNIT-{int(datetime.now().timestamp())}"
        inventory_id = payload.Inventory_ID or f"INV-{int(datetime.now().timestamp())}"

        today_str = str(date.today())
        expiry_str = str(date.today() + timedelta(days=35))

        data_to_insert = {
            "inventory_id": inventory_id,
            "hospital_id": payload.Hospital_ID or "HOSP001",
            "unit_no": unit_no,
            "record_date": str(payload.Record_date) if payload.Record_date else today_str,
            "expiry_date": str(payload.Expiry_date) if payload.Expiry_date else expiry_str,
            "status": payload.Status or "AVAILABLE",
            "group": payload.Group or payload.blood_type or "O+",
            "rh_id": payload.Rh_ID or "RH+",
            "component_id": payload.Component_ID or "COMP01",
            "user_id": current_uid
        }

        response = supabase.table("blood_inventory").insert(data_to_insert).execute()
        fullname = current_user.get("fullname") or current_user.get("Fullname", "เจ้าหน้าที่")
        return {"success": True, "message": f"ลงทะเบียนถุงเลือดสำเร็จ โดยเจ้าหน้าที่: {fullname}", "data": response.data}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 2. กลุ่ม API ข้อมูลพื้นฐานและตัวเลือก (Master Data & Dropdowns) ---

@app.get("/api/v2/master/hospitals")
@app.get("/api/master/hospitals")
def get_hospitals_list():
    try:
        response = supabase.table("hospitals").select("hospital_id, hospital_name").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v2/master/blood-components")
@app.get("/api/master/blood-components")
def get_blood_components():
    try:
        response = supabase.table("standard_blood_components").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v2/master/rh-groups")
@app.get("/api/master/rh-groups")
def get_rh_groups():
    try:
        response = supabase.table("standard_rh_groups").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 3. Auth Endpoints ---

@app.post("/api/v2/auth/register", status_code=201)
def register_user(payload: UserRegisterSchema):
    try:
        exist_user = supabase.table("users").select("user_id").eq("username", payload.Username).execute()
        if exist_user.data:
            raise HTTPException(status_code=400, detail="Username นี้ถูกใช้งานในระบบแล้ว")

        hashed_password = get_password_hash(payload.Password)

        user_data = {
            "user_id": payload.User_ID,
            "username": payload.Username,
            "password_hash": hashed_password,
            "fullname": payload.Fullname,
            "email": payload.Email,
            "department": payload.Department,
            "hospital_id": payload.Hospital_ID
        }
        
        response = supabase.table("users").insert(user_data).execute()
        return {"success": True, "message": "ลงทะเบียนผู้ใช้งานสำเร็จแล้ว"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v2/auth/login", response_model=TokenSchema)
def login_user(payload: UserLoginSchema):
    user_res = supabase.table("users").select("*").eq("username", payload.Username).execute()
    if not user_res.data:
        raise HTTPException(status_code=400, detail="ไม่พบ Username นี้ในระบบ หรือรหัสผ่านไม่ถูกต้อง")
    
    user = user_res.data[0]
    
    db_password_hash = user.get("password_hash") or user.get("Password_Hash")
    if not db_password_hash or not verify_password(payload.Password, db_password_hash):
        raise HTTPException(status_code=400, detail="ไม่พบ Username นี้ในระบบ หรือรหัสผ่านไม่ถูกต้อง")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    db_username = user.get("username") or user.get("Username")
    access_token = create_access_token(
        data={"sub": db_username}, expires_delta=access_token_expires
    )
    
    user.pop("password_hash", None)
    user.pop("Password_Hash", None)
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }
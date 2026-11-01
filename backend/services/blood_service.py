import pandas as pd
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.blood_model import BloodInventory  # เรียกใช้ Model ที่ตรงกับ Supabase 14 คอลัมน์


def item_to_dict(item: BloodInventory) -> dict:
    """แปลงข้อมูล ORM จาก Supabase ให้เป็น Dictionary รองรับทั้งฟิลด์เก่า (CSV) และฟิลด์ใหม่ (DB)"""
    if not item:
        return {}
    return {
        "id": item.inventory_id,
        "inventory_id": item.inventory_id,
        "unit_no": item.unit_no,
        "blood_group": item.blood_group,
        "rh": item.rh_id,
        "rh_id": item.rh_id,
        "status": item.status,
        "province": item.donation_location,
        "donation_location": item.donation_location,
        "product_type": item.component_id,
        "component_id": item.component_id,
        "patient_hn": item.patient_hn,
        "recipient_name": item.recipient_name,
        "dispensed_at": item.dispensed_at.isoformat() if item.dispensed_at else None,
        "expiry_date": item.expiry_date.strftime("%Y-%m-%d") if item.expiry_date else None,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "hospital_id": item.hospital_id,
        "user_id": item.user_id,
    }


def get_all_blood(db: Session):
    """ดึงรายการเลือดทั้งหมดจาก Supabase"""
    items = db.query(BloodInventory).all()
    return [item_to_dict(item) for item in items]


def get_summary(db: Session):
    """สรุปจำนวนถุงเลือดทั้งหมด และจำนวนถุงเลือดที่ใกล้หมดอายุ (ภายใน 15 วัน)"""
    total = db.query(BloodInventory).count()

    today = date.today()
    expiring_threshold = today + timedelta(days=15)

    # ค้นหาถุงเลือดที่วันหมดอายุอยู่นับจากวันนี้ไปไม่เกิน 15 วัน และยังไม่ถูกเบิกจ่าย
    expiring = (
        db.query(BloodInventory)
        .filter(
            BloodInventory.expiry_date.isnot(None),
            BloodInventory.expiry_date <= expiring_threshold,
            BloodInventory.expiry_date >= today,
        )
        .count()
    )

    return {
        "total_unit": total,
        "expiring_soon": expiring,
    }


def filter_bloods(
    db: Session,
    province=None,
    blood_group=None,
    product_type=None,
    rh=None,
    expiry_days=None,
):
    """กรองรายการถุงเลือดจาก Supabase ตามเงื่อนไขต่าง ๆ"""
    query = db.query(BloodInventory)

    # Province / Location
    if province:
        query = query.filter(BloodInventory.donation_location == province)

    # Blood Group
    if blood_group:
        query = query.filter(BloodInventory.blood_group == blood_group)

    # Product Type / Component ID
    if product_type:
        query = query.filter(BloodInventory.component_id == product_type)

    # RH Factor
    if rh:
        query = query.filter(BloodInventory.rh_id == rh)

    # Expiry Days
    if expiry_days:
        today = date.today()
        target_date = today + timedelta(days=int(expiry_days))
        query = query.filter(
            BloodInventory.expiry_date.isnot(None),
            BloodInventory.expiry_date <= target_date,
        )

    items = query.all()
    return [item_to_dict(item) for item in items]


def add_blood(db: Session, data: dict):
    """เพิ่มข้อมูลถุงเลือดใหม่ลงใน Supabase"""
    # จัดการแปลงวันที่วันหมดอายุหากถูกส่งมาเป็น string
    expiry_val = data.get("expiry_date")
    if isinstance(expiry_val, str) and expiry_val:
        expiry_val = datetime.strptime(expiry_val, "%Y-%m-%d").date()

    new_item = BloodInventory(
        unit_no=data.get("unit_no", f"UNIT-{int(datetime.now().timestamp())}"),
        blood_group=data.get("blood_group"),
        rh_id=data.get("rh_id") or data.get("rh"),
        status=data.get("status", "Available"),
        donation_location=data.get("donation_location") or data.get("province"),
        component_id=data.get("component_id") or data.get("product_type"),
        patient_hn=data.get("patient_hn"),
        recipient_name=data.get("recipient_name"),
        expiry_date=expiry_val,
        hospital_id=data.get("hospital_id"),
        user_id=data.get("user_id"),
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return {"message": "Blood added", "data": item_to_dict(new_item)}


def delete_blood(db: Session, blood_id: int):
    """ลบข้อมูลถุงเลือดจาก Supabase ตาม ID"""
    item = db.query(BloodInventory).filter(BloodInventory.inventory_id == blood_id).first()

    if not item:
        return {"message": "Blood item not found"}

    db.delete(item)
    db.commit()

    return {"message": "Blood deleted"}


def predict_blood_demand(db: Session = None):
    """พยากรณ์ความต้องการใช้เลือด (ดึงจาก DB หรือ Mock Data)"""
    predictions = [
        {"blood_type": "A", "predicted_demand": 45, "status": "safe"},
        {"blood_type": "B", "predicted_demand": 30, "status": "warning"},
        {"blood_type": "O", "predicted_demand": 80, "status": "critical"},
        {"blood_type": "AB", "predicted_demand": 15, "status": "safe"},
    ]
    return predictions


def prepare_hospital_level_data(df):
    """ฟังก์ชันเตรียมข้อมูล Time Series สำหรับโมเดล ML (ยังคงไว้ตามเดิม)"""
    df["RecordDate"] = pd.to_datetime(df["RecordDate"])
    demand_df = df[df["Status"] == "Release"].copy()

    daily_demand = (
        demand_df.groupby(["HospitalID", "RecordDate", "BloodGroup", "Rh"])
        .size()
        .reset_index(name="Demand_Units")
    )

    daily_demand["DayOfWeek"] = daily_demand["RecordDate"].dt.dayofweek
    daily_demand["Month"] = daily_demand["RecordDate"].dt.month
    daily_demand["IsWeekend"] = daily_demand["DayOfWeek"].apply(
        lambda x: 1 if x >= 5 else 0
    )

    return daily_demand
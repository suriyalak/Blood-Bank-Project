from fastapi import APIRouter

from models.transaction import (
    BloodTransaction
)

router = APIRouter()

@router.post("/inventory/add")
def add_blood(
    payload: BloodTransaction
):

    return {
        "success": True,
        "message":
            "Blood added successfully"
    }

@router.post("/inventory/remove")
def remove_blood(
    payload: BloodTransaction
):

    return {
        "success": True,
        "message":
            "Blood removed successfully"
    }

@router.get("/audit")
def get_audit_logs():

    df = pd.read_csv(
        "data/audit_logs.csv"
    )

    return df.to_dict(
        orient="records"
    )

from fastapi import APIRouter
# หากคุณนำโค้ดไปไว้ใน predict_service.py ให้เปลี่ยนชื่อ import ด้านล่างให้ตรงกัน
from services.blood_service import predict_blood_demand 

router = APIRouter(
    prefix="/api/inventory",
    tags=["inventory"]
)

@router.get("/predict")
def get_inventory_prediction():
    """
    ดึงข้อมูลพยากรณ์ความต้องการเลือดสำหรับรอบถัดไป
    """
    predictions = predict_blood_demand()
    return {"status": "success", "data": predictions}
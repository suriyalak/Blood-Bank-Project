import pandas as pd
from datetime import datetime

CSV_PATH = "data/blood.csv"


def get_all_blood():

    df = pd.read_csv(CSV_PATH)

    return df.to_dict(orient="records")


def get_summary():

    df = pd.read_csv(CSV_PATH)

    total = len(df)

    today = datetime.today()

    df["expiry_date"] = pd.to_datetime(df["expiry_date"])

    df["days_left"] = (
        df["expiry_date"] - today
    ).dt.days

    expiring = len(
        df[df["days_left"] <= 15]
    )

    return {
        "total_unit": total,
        "expiring_soon": expiring,
    }


def filter_bloods(
    province=None,
    blood_group=None,
    product_type=None,
    rh=None,
    expiry_days=None,
):

    df = pd.read_csv(CSV_PATH)

    # Province
    if province:
        df = df[
            df["province"] == province
        ]

    # Blood Group
    if blood_group:
        df = df[
            df["blood_group"] == blood_group
        ]

    # Product
    if product_type:
        df = df[
            df["product_type"] == product_type
        ]

    # RH
    if rh:
        df = df[
            df["rh"] == rh
        ]

    # Expiry
    if expiry_days:

        today = datetime.today()

        df["expiry_date"] = pd.to_datetime(
            df["expiry_date"]
        )

        df["days_left"] = (
            df["expiry_date"] - today
        ).dt.days

        df = df[
            df["days_left"]
            <= int(expiry_days)
        ]

    return df.to_dict(
        orient="records"
    )
    
def add_blood(data):

    df = pd.read_csv(CSV_PATH)

    new_id = (
        df["id"].max() + 1
    )

    data["id"] = new_id

    df = pd.concat(
        [
            df,
            pd.DataFrame([data])
        ],
        ignore_index=True
    )

    df.to_csv(
        CSV_PATH,
        index=False
    )

    return {
        "message": "Blood added"
    }


def delete_blood(
    blood_id
):

    df = pd.read_csv(CSV_PATH)

    df = df[
        df["id"] != blood_id
    ]

    df.to_csv(
        CSV_PATH,
        index=False
    )

    return {
        "message": "Blood deleted"
    }

import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
import os

def predict_blood_demand():
    # กำหนดที่อยู่ของไฟล์ข้อมูล
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(base_dir, 'data', 'blood.csv')
    
    blood_types = ['A', 'B', 'O', 'AB']
    predictions = {}

    try:
        # โหลดข้อมูลจริง หากไฟล์มีอยู่
        # df = pd.read_csv(csv_path)
        # กระบวนการ Feature Engineering (เช่น สกัด วัน, เดือน, วันในสัปดาห์ ออกมา) จะทำตรงนี้
        pass
    except FileNotFoundError:
        print(f"Warning: CSV file not found at {csv_path}")

    # --- ส่วนจำลองการพยากรณ์ (Mock Prediction) ---
    # ในการใช้งานจริง คุณจะใช้ตัวแปร df ที่ผ่านการเตรียมข้อมูลแล้วมา train โมเดล
    # ตัวอย่าง: model = RandomForestRegressor().fit(X_train, y_train)
    # y_pred = model.predict(X_next_7_days)
    
    # สมมติผลลัพธ์ที่ได้จากโมเดล (หน่วยเป็นยูนิต)
    predictions = [
        {"blood_type": "A", "predicted_demand": 45, "status": "safe"},
        {"blood_type": "B", "predicted_demand": 30, "status": "warning"},
        {"blood_type": "O", "predicted_demand": 80, "status": "critical"},
        {"blood_type": "AB", "predicted_demand": 15, "status": "safe"}
    ]

    return predictions

# ฟังก์ชันสำหรับเตรียมข้อมูล Time Series สำหรับการพยากรณ์
def prepare_hospital_level_data(df):
    # แปลง RecordDate ให้เป็นชนิดข้อมูล datetime
    df['RecordDate'] = pd.to_datetime(df['RecordDate'])
    
    # กรองเฉพาะข้อมูลสถานะ Release (ใช้งาน/จ่าย)
    demand_df = df[df['Status'] == 'Release'].copy()
    
    # เพิ่ม HospitalID เข้าไปในการจัดกลุ่ม
    daily_demand = demand_df.groupby(
        ['HospitalID', 'RecordDate', 'BloodGroup', 'Rh']
    ).size().reset_index(name='Demand_Units')
    
    # สร้าง Feature พื้นฐานสำหรับ Time-Series
    daily_demand['DayOfWeek'] = daily_demand['RecordDate'].dt.dayofweek
    daily_demand['Month'] = daily_demand['RecordDate'].dt.month
    daily_demand['IsWeekend'] = daily_demand['DayOfWeek'].apply(lambda x: 1 if x >= 5 else 0)
    
    return daily_demand
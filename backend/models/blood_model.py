from sqlalchemy import Column, BigInteger, String, Text, Date, DateTime
from sqlalchemy.sql import func
from database import Base

class BloodInventory(Base):
    __tablename__ = "blood_inventory"

    inventory_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    unit_no = Column(String, nullable=False)
    blood_group = Column(String, nullable=True)
    rh_id = Column(String, nullable=True)
    status = Column(String, nullable=True)
    donation_location = Column(Text, nullable=True)
    component_id = Column(String, nullable=True)
    patient_hn = Column(String, nullable=True)
    recipient_name = Column(Text, nullable=True)
    dispensed_at = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    hospital_id = Column(String, nullable=True)
    user_id = Column(String, nullable=True)
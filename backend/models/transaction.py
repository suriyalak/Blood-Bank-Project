from pydantic import BaseModel

class BloodTransaction(BaseModel):

    HospitalCode: str

    BloodGroup: str

    Rh: str

    ComponentType: str

    Quantity: int
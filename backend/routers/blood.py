from fastapi import APIRouter
from fastapi import Body

from services.blood_service import (
    get_all_blood,
    get_summary,
    filter_bloods
)

router = APIRouter()


@router.get("/bloods")
def bloods():
    return get_all_blood()


@router.get("/summary")
def summary():
    return get_summary()


@router.get("/filter")
def filter_data(
    province: str = None,
    blood_group: str = None,
    product_type: str = None,
    rh: str = None,
    expiry_days: int = None,
):

    return filter_bloods(
        province,
        blood_group,
        product_type,
        rh,
        expiry_days,
    )
    
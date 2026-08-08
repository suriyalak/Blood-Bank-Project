import pandas as pd

from datetime import datetime

AUDIT_FILE = "data/audit_logs.csv"

def write_audit_log(data):

    audit = pd.DataFrame([{

        "TransactionID":
            data["TransactionID"],

        "Action":
            data["Action"],

        "HospitalCode":
            data["HospitalCode"],

        "BloodGroup":
            data["BloodGroup"],

        "Rh":
            data["Rh"],

        "ComponentType":
            data["ComponentType"],

        "Quantity":
            data["Quantity"],

        "CreatedAt":
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            )

    }])

    try:

        existing = pd.read_csv(
            AUDIT_FILE
        )

        audit = pd.concat(
            [existing, audit],
            ignore_index=True
        )

    except:

        pass

    audit.to_csv(
        AUDIT_FILE,
        index=False
    )
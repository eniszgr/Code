from fastapi import APIRouter
from app.models.input_model import InputText #import model

router = APIRouter(prefix="/predict")

@router.post("/")
def predict(item: InputText): #input type is InputText from body
    text = item.text.lower() #reach text from item object
    department = "Genel"

    if "sipariş" in text:
        department = "Müşteri Hizmetleri"
    if "hata" in text:
        department = "Teknik Destek"

    return {
        "Department": department,
        "Predict_Score": 0.91
    }

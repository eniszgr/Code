from fastapi import APIRouter
from app.models.input_model import InputText

router = APIRouter(prefix="/predict", tags=["Classify"])

@router.post("/")
def predict(item: InputText):
    text = item.text.lower()
    label = "Genel"

    if "sipariş" in text:
        label = "Müşteri Hizmetleri"
    if "hata" in text:
        label = "Teknik Destek"

    return {
        "label": label,
        "score": 0.91
    }

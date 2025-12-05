from fastapi import APIRouter
from app.models.input_model import InputText
from app.services.hf_classifier_service import classify_text

router = APIRouter(prefix="/siniflandirma")

@router.post("/")
def classify(item: InputText):
    result = classify_text(item.text)
    return result

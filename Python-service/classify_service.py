# classify_service.py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()  # <-- bu kesin olmalı

class Input(BaseModel):
    text: str

@app.post("/predict")
def predict(item: Input):
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

@app.get("/hello")
def hello():
    return {"message": "Hello from Python FastAPI!"}
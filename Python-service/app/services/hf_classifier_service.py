from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import torch
import json
from huggingface_hub import hf_hub_download
from google import genai
import os
from dotenv import load_dotenv
load_dotenv()


HF_ID = os.getenv("HF_ID")



# ---- HF Model & Tokenizer ----
tokenizer = AutoTokenizer.from_pretrained(HF_ID)
model = AutoModelForSequenceClassification.from_pretrained(HF_ID)

# Label mapping
label_file = hf_hub_download(repo_id=HF_ID, filename="label_mapping.json")
with open(label_file, "r", encoding="utf-8") as f:
    departments = json.load(f)

# ---- Gemini Setup ----
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
model_name = "gemini-2.5-flash"

if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except:
        client = None

# HF pipeline
pipe = pipeline(
    "text-classification",
    model=model,
    tokenizer=tokenizer,
    device=0 if torch.cuda.is_available() else -1
)


# ------------ CLASSIFY FUNCTION -------------
def classify_text(input_text: str):
    fixed_text = input_text

    # Gemini ile gramer düzeltme
    if client:
        prompt = f"""
Aşağıdaki kullanıcı girdisini dil bilgisi ve yazım hatalarına göre düzelt.
Sadece düzeltilmiş metni geri döndür.

Kullanıcı Girdisi: '{input_text}'
Düzeltilmiş Metin:
"""
        try:
            r = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            fixed_text = r.text.strip()

        except:
            fixed_text = input_text

    # HF sınıflandırma
    try:
        res = pipe(fixed_text)[0]
        pred_idx = int(res["label"].split("_")[-1])

        return {
            "original_text": input_text,
            "fixed_text": fixed_text,
            "department": departments[pred_idx],
            "score": round(res["score"], 4)
        }

    except Exception as e:
        return {
            "error": str(e)
        }

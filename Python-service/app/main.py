# app/main.py
from fastapi import FastAPI
from app.routes import classify
from dotenv import load_dotenv
import os

# .env dosyasını yükle
load_dotenv()

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8000))

app = FastAPI(title="Python Model Service")

# Routers
app.include_router(classify.router)

@app.get("/hello")
def hello():
    return {"message": "Hello from Python FastAPI!"}


# Uvicorn'u .env'den otomatik çalıştırmak için:
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=True
    )

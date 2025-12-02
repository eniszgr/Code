# app/main.py
from fastapi import FastAPI
from app.routes import classify
from dotenv import load_dotenv
import os

# .env yükle
load_dotenv()

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8000))

app = FastAPI(title="Python Model Service")

# Routers
app.include_router(classify.router) 

@app.get("/hello")
def hello():
    return {"message": "Hello from Python FastAPI!"}

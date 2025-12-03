# app/main.py
from fastapi import FastAPI
from app.routes import classify
from dotenv import load_dotenv
import os

#load .env file 
load_dotenv()

#pull variables from .env
HOST = os.getenv("HOST")
PORT = int(os.getenv("PORT"))

app = FastAPI(title="Python Model Service")

# Routers
app.include_router(classify.router) #router variable from classify.py

@app.get("/hello")
def hello():
    return {"message": "Hello from Python FastAPI!"}


# to run shortly = python -m app.main 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=True
    )

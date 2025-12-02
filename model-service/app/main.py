from fastapi import FastAPI
from app.routes import classify

app = FastAPI(title="Python Model Service")

# Routers
app.include_router(classify.router)

@app.get("/hello")
def hello():
    return {"message": "Hello from Python FastAPI!"}

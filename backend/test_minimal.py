from fastapi import FastAPI

# Test minimal app without any of our modules
app = FastAPI()

@app.get("/")
def root():
    return {"message": "Hello from minimal test"}

@app.get("/test")
def test():
    return {"status": "working"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002)
from fastapi import FastAPI
import uvicorn

from web import hello_controller
app = FastAPI()

app.include_router(hello_controller.router)

def main():
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
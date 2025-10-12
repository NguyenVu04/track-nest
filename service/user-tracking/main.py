import uvicorn
from fastapi import FastAPI,Request
from contextlib import asynccontextmanager

from connection.user_websocket_manager import UserWebSocketManager
from connection.user_websocket_controller import UserWebSocketController

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Dependencies
    user_websocket_manager = UserWebSocketManager()
    user_websocket_controller = UserWebSocketController(user_websocket_manager)

    # Include Routers
    app.include_router(user_websocket_controller.user_websocket_router, prefix="/ws/user")

    app.add_api_route("/", root)
    app.add_api_route("/hello/{name}", say_hello)
    yield

async def root():
    return {"message": "Hello World"}

async def say_hello(name: str):
    return {"message": f"Hello {name}"}

def main():
    app = FastAPI(
        root_path="/api/v1",
        title="User Tracking Service",
        version="0.0.1",
        lifespan=lifespan
    )
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
import uvicorn
from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
import json
import base64

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

async def root(request: Request):
    # Get the x-userinfo header
    userinfo_header = request.headers.get("x-userinfo")
    if not userinfo_header:
        return {"message": "Hello World", "userinfo": None}

    try:
        # Decode base64 (add padding if needed)
        missing_padding = len(userinfo_header) % 4
        if missing_padding:
            userinfo_header += '=' * (4 - missing_padding)
        decoded = base64.b64decode(userinfo_header)
        # Parse JSON
        userinfo = json.loads(decoded)
        return {"message": "Hello World", "userinfo": userinfo}
    except Exception as e:
        return {"message": "Hello World", "error": str(e)}

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
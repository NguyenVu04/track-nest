from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from uuid import UUID

from configuration.authenticate_apisix import authenticate_apisix
from configuration.keycloak_user_info import KeycloakUserInfo
from connection.user_websocket_manager import UserWebSocketManager

class UserWebSocketController:
    user_websocket_router: APIRouter
    _websocket_manager: UserWebSocketManager

    def __init__(self, websocket_manager: UserWebSocketManager):
        self.user_websocket_router = APIRouter()
        self.user_websocket_router.websocket("")(self.user_websocket_endpoint)
        self._websocket_manager = websocket_manager

    async def user_websocket_endpoint(self, websocket: WebSocket, user_info: KeycloakUserInfo = Depends(authenticate_apisix)) -> None:
        user_id = user_info.sub
        index = await self._websocket_manager.connect(user_id, websocket)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            await self._websocket_manager.disconnect(user_id, index)
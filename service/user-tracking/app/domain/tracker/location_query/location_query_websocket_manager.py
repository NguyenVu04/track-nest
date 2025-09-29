from fastapi import WebSocket
from asyncio import Lock

from app.domain.tracker.location_query.dto.location_query_websocket_dto import LocationQueryWebSocketDto

class LocationQueryWebSocketManager:
    _connections: dict[str, WebSocket]
    _lock: Lock

    def __init__(self):
        self._connections = {}
        self._lock = Lock()

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self._connections[user_id] = websocket

    async def disconnect(self, user_id: str):
        async with self._lock:
            if user_id in self._connections:
                self._connections.pop(user_id)

    async def send_message(self, user_id: str, data: LocationQueryWebSocketDto):
        async with self._lock:
            websocket = self._connections.get(user_id)
            if websocket:
                await websocket.send_json(data.model_dump_json())
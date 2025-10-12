import asyncio

from fastapi import WebSocket, WebSocketException, status
from uuid import UUID
from asyncio.locks import Lock

from connection.message_content import MessageContent
from connection.user_connection_manager import UserConnectionManager
from connection.message import Message

class UserWebSocketManager(UserConnectionManager):
    connections: dict[UUID, list[WebSocket]]
    lock: Lock

    def __init__(self):
        self.connections = {}
        self.lock = Lock()

    async def connect(self, user_id: UUID, websocket: WebSocket) -> int:
        await websocket.accept()
        async with self.lock:
            if user_id not in self.connections:
                self.connections[user_id] = [websocket]
                return 0
            else:
                self.connections[user_id].append(websocket)
                return len(self.connections[user_id]) - 1

    async def disconnect(self, user_id: UUID, index: int) -> None:
        async with self.lock:
            if user_id in self.connections:
                self.connections.get(user_id).pop(index)
                if not self.connections.get(user_id):
                    self.connections.pop(user_id)

    async def send_message(self, user_id: UUID, topic: str, message: MessageContent) -> None:
        async with self.lock:
            websocket = self.connections.get(user_id)
            if websocket:
                message = Message(topic=topic, message=message.get_message_content())
                result = await asyncio.gather(*(ws.send_json(message.model_dump()) for ws in websocket), return_exceptions=True)

                for i, res in enumerate(result):
                    if isinstance(res, Exception):
                        self.connections[user_id].pop(i)

                if not self.connections.get(user_id):
                    self.connections.pop(user_id)
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from app.config.user_info_header import UserInfoHeader, get_user_info_header

from app.domain.tracker.location_command.location_command_service import LocationCommandService
from app.domain.tracker.location_query.location_query_service import LocationQueryService
from app.domain.tracker.location_query.location_query_websocket_manager import LocationQueryWebSocketManager
from app.domain.tracker.location_query.dto.location_query_websocket_dto import LocationQueryWebSocketDto
from app.domain.tracker.location_command.dto.post_location_dto import PostLocationDto

class TrackingController:
    router: APIRouter

    _location_command_service: LocationCommandService
    _location_query_service: LocationQueryService
    _websocket_manager: LocationQueryWebSocketManager

    def __init__(self, location_command_service: LocationCommandService, location_query_service: LocationQueryService, websocket_manager: LocationQueryWebSocketManager):
        self._location_command_service = location_command_service
        self._location_query_service = location_query_service
        self._websocket_manager = websocket_manager

        self.router = APIRouter(prefix="/tracking", tags=["Tracking"])
        self.setup_routes()

    def setup_routes(self):
        self.router.add_api_route("/location", self.post_location, methods=["POST"])
        self.router.add_api_websocket_route("/location/ws/{user_id}", self.track_location)

    async def post_location(self, location: PostLocationDto, user_info: UserInfoHeader = Depends(get_user_info_header)):
        await self._websocket_manager.send_message(str(user_info.sub), LocationQueryWebSocketDto(latitude=location.latitude, longitude=location.longitude, timestamp=location.timestamp, accuracy=location.accuracy))
        return {"message": "Location received", "user_id": str(user_info.sub), "location": location}

    async def track_location(self, websocket: WebSocket, user_id: str):
        await self._websocket_manager.connect(user_id, websocket)
        try:
            while True:
                message = await websocket.receive_json()
                print(f"Received message from user {user_id}: {message}")
        except WebSocketDisconnect:
            await self._websocket_manager.disconnect(user_id)
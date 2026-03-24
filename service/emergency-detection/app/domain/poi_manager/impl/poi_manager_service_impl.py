from typing import AsyncGenerator
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from configuration.database.database_config import get_db
from core.datatype.page_response import PageResponse
from domain.poi_manager.impl.datatype.delete_poi_response import DeletePoiResponse
from domain.poi_manager.impl.datatype.get_pois_request import GetPoisRequest
from domain.poi_manager.impl.datatype.get_pois_response import GetPoisResponse
from domain.poi_manager.impl.datatype.post_poi_request import PostPoiRequest
from domain.poi_manager.impl.datatype.post_poi_response import PostPoiResponse
from domain.poi_manager.impl.datatype.put_poi_request import PutPoiRequest
from domain.poi_manager.impl.datatype.put_poi_response import PutPoiResponse
from domain.poi_manager.service.poi_manager_service import PoiManagerService

class PoiManagerServiceImpl(PoiManagerService):
    db: AsyncGenerator[AsyncSession, None]

    def __init__(self):
        self.db = get_db()

    def retrieve_pois(self, user_id: UUID, request: GetPoisRequest) -> PageResponse[GetPoisResponse]:
        pass

    def create_poi(self, user_id: UUID, request: PostPoiRequest) -> PostPoiResponse:
        pass

    def update_poi(self, user_id: UUID, poid_id: UUID, request: PutPoiRequest) -> PutPoiResponse:
        pass

    def delete_poi(self, user_id: UUID, poi_id: UUID) -> DeletePoiResponse:
        pass

def get_poi_manager_service() -> PoiManagerService:
    return PoiManagerServiceImpl()
from uuid import UUID

from abc import ABC, abstractmethod

from core.datatype.page_response import PageResponse
from domain.poi_manager.impl.datatype.delete_poi_response import DeletePoiResponse
from domain.poi_manager.impl.datatype.get_pois_request import GetPoisRequest
from domain.poi_manager.impl.datatype.get_pois_response import GetPoisResponse
from domain.poi_manager.impl.datatype.post_poi_request import PostPoiRequest
from domain.poi_manager.impl.datatype.post_poi_response import PostPoiResponse
from domain.poi_manager.impl.datatype.put_poi_request import PutPoiRequest
from domain.poi_manager.impl.datatype.put_poi_response import PutPoiResponse

class PoiManagerService(ABC):

    @abstractmethod
    def retrieve_pois(
            self,
            user_id: UUID,
            request: GetPoisRequest
    ) -> PageResponse[GetPoisResponse]:
        pass

    @abstractmethod
    def create_poi(
            self,
            user_id: UUID,
            request: PostPoiRequest
    ) -> PostPoiResponse:
        pass

    @abstractmethod
    def update_poi(
            self,
            user_id: UUID,
            poid_id: UUID,
            request: PutPoiRequest
    ) -> PutPoiResponse:
        pass

    @abstractmethod
    def delete_poi(
            self,
            user_id: UUID,
            poi_id: UUID
    ) -> DeletePoiResponse:
        pass
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Path
from fastapi.params import Body, Query

from configuration.security.security_utils import require_role
from core.datatype.page_response import PageResponse
from domain.poi_manager.impl.datatype.delete_poi_response import DeletePoiResponse
from domain.poi_manager.impl.datatype.get_pois_request import GetPoisRequest
from domain.poi_manager.impl.datatype.get_pois_response import GetPoisResponse
from domain.poi_manager.impl.datatype.post_poi_request import PostPoiRequest
from domain.poi_manager.impl.datatype.post_poi_response import PostPoiResponse
from domain.poi_manager.impl.datatype.put_poi_request import PutPoiRequest
from domain.poi_manager.impl.datatype.put_poi_response import PutPoiResponse
from domain.poi_manager.impl.poi_manager_service_impl import get_poi_manager_service

REQUIRED_ROLE = "USER"
router = APIRouter(
    prefix="/poi-manager",
    tags=["POI Manager"],
)

@router.get(
    "/pois",
    response_model=PageResponse[GetPoisResponse],
    response_model_exclude_none=True,
    summary="Get a list of POIs within a specified radius of a given location, with optional filtering by POI type.",
)
async def get_pois(
        payload: Annotated[GetPoisRequest, Query(description="The parameters for retrieving POIs, including location, radius, and optional type filter")],
        service=Depends(get_poi_manager_service),
        context=Depends(require_role(REQUIRED_ROLE))
) -> PageResponse[GetPoisResponse]:
    """
    Retrieve a list of Points of Interest (POIs) based on the provided location and radius. Optionally, filter the results by POI type.
    """
    return service.retrieve_pois(context.user_id, payload)

@router.post(
    "/poi",
    response_model=PostPoiResponse,
    response_model_exclude_none=True,
    summary="Create a new POI with the provided details.",
)
async def create_poi(
        payload: Annotated[PostPoiRequest, Body(description="The parameters for creating a new POI")],
        service=Depends(get_poi_manager_service),
        context=Depends(require_role(REQUIRED_ROLE))
) -> PostPoiResponse:
    """
    Create a new Point of Interest (POI) with the specified details, including name, description, location, and type.
    """
    return service.create_poi(context.user_id, payload)

@router.put(
    "/poi/{poi_id}",
    response_model=PutPoiRequest,
    response_model_exclude_none=True,
    summary="Update an existing POI with the provided details.",
)
async def update_poi(
        poi_id: Annotated[UUID, Path(description="The unique identifier of the POI to update")],
        payload: Annotated[PutPoiRequest, Body(description="The updated POI")],
        service=Depends(get_poi_manager_service),
        context=Depends(require_role(REQUIRED_ROLE)),
) -> PutPoiResponse:
    """
    Update an existing Point of Interest (POI) identified by the provided ID with the new details.
    """
    return service.update_poi(context.user_id, poi_id, payload)

@router.delete(
    "/poi/{poi_id}",
    response_model=DeletePoiResponse,
    response_model_exclude_none=True,
    summary="Delete an existing POI by its unique identifier.",
)
async def delete_poi(
        poi_id: Annotated[UUID, Path(description="The unique identifier of the POI to delete")],
        service=Depends(get_poi_manager_service),
        context=Depends(require_role(REQUIRED_ROLE)),
) -> DeletePoiResponse:
    """
    Delete an existing Point of Interest (POI) identified by the provided ID.
    """
    return service.delete_poi(context.user_id, poi_id)
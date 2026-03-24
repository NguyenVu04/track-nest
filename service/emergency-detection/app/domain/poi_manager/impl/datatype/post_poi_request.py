from pydantic import BaseModel, Field

from core.entity.poi_type import PoiTypeEnum


class PostPoiRequest(BaseModel):
    longitude_degrees: float = Field(..., ge=-180, le=180, description="Longitude of the POI in degrees", examples=[0.0])
    latitude_degrees: float = Field(..., ge=-90, le=90, description="Latitude of the POI in degrees", examples=[0.0])
    radius_meters: float = Field(..., gt=0, description="Radius of the POI in meters", examples=[0.0])
    name: str = Field(..., max_length=255, description="Name of the POI", examples=["Home"])
    poi_type: PoiTypeEnum = Field(..., description="Type of the POI", examples=[PoiTypeEnum.HOME])
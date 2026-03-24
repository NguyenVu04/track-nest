from pydantic import BaseModel, Field

from core.entity.poi_type import PoiTypeEnum

class GetPoisRequest(BaseModel):
    page_number: int = Field(..., description="Page number", examples=[1])
    page_size: int = Field(..., description="Number of items per page", examples=[10])
    longitude_degrees: float = Field(..., description="longitude of center", examples=[0.0])
    latitude_degrees: float = Field(..., description="latitude of center", examples=[0.0])
    radius_meters: float = Field(..., description="radius in meters", examples=[1000.0])
    poi_type: PoiTypeEnum | None = Field(default=None, description="Type of POI to filter by", examples=[PoiTypeEnum.HOME])
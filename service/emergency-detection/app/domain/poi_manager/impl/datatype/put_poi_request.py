from pydantic import BaseModel, Field

from core.entity.poi_type import PoiTypeEnum

class PutPoiRequest(BaseModel):
    longitude_degrees: float | None = Field(..., ge=-180, le=180, description="Longitude value of the POI", examples=[0.0])
    latitude_degrees: float | None = Field(..., ge=-90, le=90, description="Latitude value of the POI", examples=[0.0])
    radius_meters: float | None = Field(..., gt=0, description="Radius of the POI in meters", examples=[0.0])
    name: str | None = Field(..., description="Name of the POI", examples=["Home"])
    poi_type: PoiTypeEnum | None = Field(..., description="Type of the POI", examples=[PoiTypeEnum.HOME])
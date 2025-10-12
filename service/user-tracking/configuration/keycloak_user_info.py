from pydantic import BaseModel, Field
from uuid import UUID

class KeycloakUserInfo(BaseModel):
    sub: UUID = Field(...)
    # email: str = Field(...)
    # preferred_username: str = Field(...)
    # roles: list[str] = Field(default_factory=list)
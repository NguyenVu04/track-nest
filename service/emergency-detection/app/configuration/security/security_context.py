from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

class SecurityContext(BaseModel):
    user_id: UUID
    roles: List[str] = []
    email: str
    username: str
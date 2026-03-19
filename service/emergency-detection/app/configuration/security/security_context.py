from pydantic import BaseModel
from typing import Optional, List

class SecurityContext(BaseModel):
    sub: str
    roles: List[str] = []
    email: Optional[str] = None
    username: Optional[str] = None
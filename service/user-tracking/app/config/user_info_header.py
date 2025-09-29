from pydantic import BaseModel
from uuid import UUID
import json

from fastapi import Header, HTTPException

class UserInfoHeader(BaseModel):
    sub: UUID

def get_user_info_header(x_userinfo: str = Header(...)) -> UserInfoHeader:
    try:
        user_info_dict = json.loads(x_userinfo)
        return UserInfoHeader(**user_info_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid X-UserInfo header: {e}")
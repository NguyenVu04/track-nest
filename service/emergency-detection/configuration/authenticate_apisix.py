import json

from fastapi import Depends, HTTPException, status, Header

from configuration.keycloak_user_info import KeycloakUserInfo

def authenticate_apisix(x_userinfo: str = Header(default="{}", alias="X-Userinfo")) -> KeycloakUserInfo:
    try:
        user_info = KeycloakUserInfo(**json.loads(x_userinfo))
        return user_info
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user info"
        )
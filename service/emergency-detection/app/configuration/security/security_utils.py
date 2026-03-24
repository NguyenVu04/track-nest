from typing import Callable

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from configuration.security.security_context import SecurityContext

security = HTTPBearer(auto_error=False)

def get_token(
        credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    return credentials

def get_current_user(request: Request) -> SecurityContext:
    user = getattr(request.state, "user", None)
    if user is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


def require_role(role: str) -> Callable[..., SecurityContext]:
    def checker(user=Depends(get_current_user)):
        if role not in user.roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user

    return checker

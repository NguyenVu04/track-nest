import jwt
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from configuration.security.security_context import SecurityContext


class SecurityMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):

        auth = request.headers.get("Authorization")

        if auth is None:
            request.state.user = None
            return await call_next(request)

        if not auth.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Invalid authorization header"})

        token = auth.split(" ")[1]

        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False}
            )

            user = SecurityContext(**payload)

            # attach to request
            request.state.user = user

        except Exception:
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})

        return await call_next(request)
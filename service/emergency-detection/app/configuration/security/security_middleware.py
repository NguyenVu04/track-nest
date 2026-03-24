import logging

import jwt
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from configuration.security.security_context import SecurityContext

logger = logging.getLogger(__name__)

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

            user = SecurityContext(
                user_id=payload["sub"],
                email=payload.get("email"),
                username=payload.get("preferred_username"),
                roles=payload.get("realm_access", {}).get("roles", [])
            )

            # attach to request
            request.state.user = user

        except jwt.DecodeError:
            logger.warning(f"Decoding failed for {token}")
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})
        except Exception:
            logger.exception("Unexpected error in security middleware")
            return JSONResponse(status_code=500, content={"detail": "Internal error"})

        return await call_next(request)
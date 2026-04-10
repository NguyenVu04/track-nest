from __future__ import annotations

import base64
import binascii
import json
from typing import Any, Mapping

from src.util.auth import AuthenticatedUser
from src.util.exceptions import UnauthorizedException


def decode_verified_jwt_claims(token: str) -> dict[str, Any]:
    parts: list[str] = token.split(".")
    if len(parts) < 2:
        raise UnauthorizedException(
            "Invalid bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload: str = parts[1]
    padding: str = "=" * (-len(payload) % 4)

    try:
        decoded_payload: bytes = base64.urlsafe_b64decode(f"{payload}{padding}")
        claims: Any = json.loads(decoded_payload)
    except (binascii.Error, json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise UnauthorizedException(
            "Invalid bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if not isinstance(claims, dict):
        raise UnauthorizedException(
            "Invalid bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return dict(claims)


def user_from_keycloak_claims(claims: Mapping[str, Any]) -> AuthenticatedUser:
    subject: str | None = _string_claim(claims, "sub")
    if subject is None:
        raise UnauthorizedException(
            "Bearer token is missing subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthenticatedUser(
        subject=subject,
        username=_string_claim(claims, "preferred_username"),
        email=_string_claim(claims, "email"),
        realm_roles=_realm_roles(claims),
    )


def _string_claim(claims: Mapping[str, Any], name: str) -> str | None:
    value: Any = claims.get(name)
    if value is None:
        return None
    return str(value)


def _realm_roles(claims: Mapping[str, Any]) -> tuple[str, ...]:
    realm_access: Any = claims.get("realm_access")
    if not isinstance(realm_access, Mapping):
        return ()

    roles: Any = realm_access.get("roles")
    if not isinstance(roles, list | tuple | set):
        return ()

    return tuple(sorted(str(role) for role in roles))

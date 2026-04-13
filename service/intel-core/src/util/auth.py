from __future__ import annotations

from contextvars import ContextVar, Token
from dataclasses import dataclass

from src.util.exceptions import ForbiddenException, UnauthorizedException

_current_user: ContextVar["AuthenticatedUser | None"] = ContextVar(
    "current_user",
    default=None,
)
_current_token: ContextVar[str | None] = ContextVar("current_token", default=None)


@dataclass(frozen=True, slots=True)
class AuthenticatedUser:
    subject: str
    username: str | None = None
    email: str | None = None
    realm_roles: tuple[str, ...] = ()

    @property
    def roles(self) -> tuple[str, ...]:
        return self.realm_roles

    def has_role(self, role: str) -> bool:
        return role in self.realm_roles

    def has_any_role(
        self,
        *roles: str,
    ) -> bool:
        return any(self.has_role(role) for role in roles)

    def has_all_roles(
        self,
        *roles: str,
    ) -> bool:
        return all(self.has_role(role) for role in roles)


def set_current_auth(
    user: AuthenticatedUser | None,
    token: str | None,
) -> tuple[Token[AuthenticatedUser | None], Token[str | None]]:
    user_token: Token[AuthenticatedUser | None] = _current_user.set(user)
    bearer_token: Token[str | None] = _current_token.set(token)
    return user_token, bearer_token


def reset_current_auth(
    user_token: Token[AuthenticatedUser | None],
    bearer_token: Token[str | None],
) -> None:
    _current_user.reset(user_token)
    _current_token.reset(bearer_token)


def get_current_user() -> AuthenticatedUser | None:
    return _current_user.get()


def require_current_user() -> AuthenticatedUser:
    user: AuthenticatedUser | None = get_current_user()
    if user is None:
        raise UnauthorizedException(
            "Authentication is required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_bearer_token() -> str | None:
    return _current_token.get()


def has_role(role: str) -> bool:
    user: AuthenticatedUser | None = get_current_user()
    return user.has_role(role) if user is not None else False


def has_any_role(*roles: str) -> bool:
    user: AuthenticatedUser | None = get_current_user()
    return user.has_any_role(*roles) if user is not None else False


def has_all_roles(*roles: str) -> bool:
    user: AuthenticatedUser | None = get_current_user()
    return user.has_all_roles(*roles) if user is not None else False


def require_role(role: str) -> AuthenticatedUser:
    user: AuthenticatedUser = require_current_user()
    if not user.has_role(role):
        raise ForbiddenException("Required role is missing")
    return user


def require_any_role(
    *roles: str,
) -> AuthenticatedUser:
    user: AuthenticatedUser = require_current_user()
    if not user.has_any_role(*roles):
        raise ForbiddenException("Required role is missing")
    return user


def require_all_roles(
    *roles: str,
) -> AuthenticatedUser:
    user: AuthenticatedUser = require_current_user()
    if not user.has_all_roles(*roles):
        raise ForbiddenException("Required role is missing")
    return user

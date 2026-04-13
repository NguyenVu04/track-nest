from importlib import import_module

__all__: list[str] = [
    "AuthenticatedUser",
    "configure_bearer_auth_openapi",
    "get_current_bearer_token",
    "get_current_user",
    "has_all_roles",
    "has_any_role",
    "has_role",
    "keycloak_user_filter",
    "require_all_roles",
    "require_any_role",
    "require_current_user",
    "require_role",
]

_EXPORTS: dict[str, tuple[str, str]] = {
    "AuthenticatedUser": ("...util.auth", "AuthenticatedUser"),
    "configure_bearer_auth_openapi": (".openapi", "configure_bearer_auth_openapi"),
    "get_current_bearer_token": ("...util.auth", "get_current_bearer_token"),
    "get_current_user": ("...util.auth", "get_current_user"),
    "has_all_roles": ("...util.auth", "has_all_roles"),
    "has_any_role": ("...util.auth", "has_any_role"),
    "has_role": ("...util.auth", "has_role"),
    "keycloak_user_filter": (".middleware", "keycloak_user_filter"),
    "require_all_roles": ("...util.auth", "require_all_roles"),
    "require_any_role": ("...util.auth", "require_any_role"),
    "require_current_user": ("...util.auth", "require_current_user"),
    "require_role": ("...util.auth", "require_role"),
}


def __getattr__(name: str):
    if name in _EXPORTS:
        module_name, attr_name = _EXPORTS[name]
        value = getattr(import_module(module_name, __name__), attr_name)
        globals()[name] = value
        return value
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

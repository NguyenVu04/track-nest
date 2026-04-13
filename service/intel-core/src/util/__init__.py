from importlib import import_module

__all__: list[str] = [
    "get_settings",
    "Settings",
    "setup_logging",
    "get_logger",
    "set_correlation_id",
    "get_correlation_id",
    "AuthenticatedUser",
    "get_current_bearer_token",
    "get_current_user",
    "has_all_roles",
    "has_any_role",
    "has_role",
    "require_all_roles",
    "require_any_role",
    "require_current_user",
    "require_role",
    "AppException",
    "BadRequestException",
    "ConflictException",
    "ForbiddenException",
    "NotFoundException",
    "ServiceUnavailableException",
    "UnauthorizedException",
    "register_exception_handlers",
]

_EXPORTS: dict[str, tuple[str, str]] = {
    "get_settings": (".settings", "get_settings"),
    "Settings": (".settings", "Settings"),
    "setup_logging": (".logging", "setup_logging"),
    "get_logger": (".logging", "get_logger"),
    "set_correlation_id": (".logging", "set_correlation_id"),
    "get_correlation_id": (".logging", "get_correlation_id"),
    "AuthenticatedUser": (".auth", "AuthenticatedUser"),
    "get_current_bearer_token": (".auth", "get_current_bearer_token"),
    "get_current_user": (".auth", "get_current_user"),
    "has_all_roles": (".auth", "has_all_roles"),
    "has_any_role": (".auth", "has_any_role"),
    "has_role": (".auth", "has_role"),
    "require_all_roles": (".auth", "require_all_roles"),
    "require_any_role": (".auth", "require_any_role"),
    "require_current_user": (".auth", "require_current_user"),
    "require_role": (".auth", "require_role"),
    "AppException": (".exceptions", "AppException"),
    "BadRequestException": (".exceptions", "BadRequestException"),
    "ConflictException": (".exceptions", "ConflictException"),
    "ForbiddenException": (".exceptions", "ForbiddenException"),
    "NotFoundException": (".exceptions", "NotFoundException"),
    "ServiceUnavailableException": (".exceptions", "ServiceUnavailableException"),
    "UnauthorizedException": (".exceptions", "UnauthorizedException"),
    "register_exception_handlers": (".exceptions", "register_exception_handlers"),
}


def __getattr__(name: str):
    if name in _EXPORTS:
        module_name, attr_name = _EXPORTS[name]
        value = getattr(import_module(module_name, __name__), attr_name)
        globals()[name] = value
        return value
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

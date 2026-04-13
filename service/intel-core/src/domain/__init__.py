from importlib import import_module

__all__: list[str] = [
    "ChatbotService",
    "ChatbotServiceImpl",
    "PostMessageRequest",
    "PostMessageResponse",
    "PostSessionRequest",
    "PostSessionResponse",
    "GetSessionResponse",
]

_EXPORTS: dict[str, tuple[str, str]] = {
    "ChatbotService": (".chatbot", "ChatbotService"),
    "ChatbotServiceImpl": (".chatbot", "ChatbotServiceImpl"),
    "PostMessageRequest": (".chatbot", "PostMessageRequest"),
    "PostMessageResponse": (".chatbot", "PostMessageResponse"),
    "PostSessionRequest": (".chatbot", "PostSessionRequest"),
    "PostSessionResponse": (".chatbot", "PostSessionResponse"),
    "GetSessionResponse": (".chatbot", "GetSessionResponse"),
}


def __getattr__(name: str):
    if name in _EXPORTS:
        module_name, attr_name = _EXPORTS[name]
        value = getattr(import_module(module_name, __name__), attr_name)
        globals()[name] = value
        return value
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
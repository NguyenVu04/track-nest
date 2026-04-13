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
    "ChatbotService": (".chatbot_service", "ChatbotService"),
    "ChatbotServiceImpl": (".chatbot_service_impl", "ChatbotServiceImpl"),
    "PostMessageRequest": (".datatype.post_message_dto", "PostMessageRequest"),
    "PostMessageResponse": (".datatype.post_message_dto", "PostMessageResponse"),
    "PostSessionRequest": (".datatype.post_session_dto", "PostSessionRequest"),
    "PostSessionResponse": (".datatype.post_session_dto", "PostSessionResponse"),
    "GetSessionResponse": (".datatype.get_session_dto", "GetSessionResponse"),
}


def __getattr__(name: str):
    if name in _EXPORTS:
        module_name, attr_name = _EXPORTS[name]
        value = getattr(import_module(module_name, __name__), attr_name)
        globals()[name] = value
        return value
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
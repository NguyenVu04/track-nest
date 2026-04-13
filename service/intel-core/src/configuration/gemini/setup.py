from __future__ import annotations

from functools import lru_cache

from google import genai

from src.util.settings import Settings, get_settings


def _validate_gemini_settings(settings: Settings) -> None:
	if not settings.gemini_api_key:
		raise RuntimeError("Gemini API is not configured. Missing setting: gemini_api_key")


@lru_cache(maxsize=1)
def get_gemini_client() -> genai.Client:
	settings: Settings = get_settings()
	_validate_gemini_settings(settings)
	return genai.Client(api_key=settings.gemini_api_key)


def get_default_gemini_model() -> str:
	settings: Settings = get_settings()
	return settings.gemini_model

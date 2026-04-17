from __future__ import annotations

from functools import lru_cache

import boto3
from botocore.client import Config

from src.util.settings import Settings, get_settings


def _validate_endpoint(settings: Settings) -> None:
    if not settings.s3_endpoint:
        raise RuntimeError("S3 storage is not configured. Missing settings: s3_endpoint")


def _build_client(access_key: str, secret_key: str):
    settings: Settings = get_settings()
    _validate_endpoint(settings)
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=settings.s3_region,
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
        ),
    )


@lru_cache(maxsize=1)
def get_criminal_reports_client():
    settings: Settings = get_settings()
    return _build_client(
        settings.s3_criminalreports_access_key,
        settings.s3_criminalreports_secret_key,
    )


@lru_cache(maxsize=1)
def get_user_tracking_client():
    settings: Settings = get_settings()
    return _build_client(
        settings.s3_usertracking_access_key,
        settings.s3_usertracking_secret_key,
    )

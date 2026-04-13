from __future__ import annotations

from functools import lru_cache

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from src.util.settings import Settings, get_settings


def _validate_storage_settings(settings: Settings) -> None:
    missing: list[str] = []
    if not settings.s3_endpoint:
        missing.append("s3_endpoint")
    if not settings.s3_access_key:
        missing.append("s3_access_key")
    if not settings.s3_secret_key:
        missing.append("s3_secret_key")
    if not settings.s3_bucket_name:
        missing.append("s3_bucket_name")

    if missing:
        raise RuntimeError(
            "S3 storage is not configured. Missing settings: " + ", ".join(missing)
        )


@lru_cache(maxsize=1)
def get_s3_client():
    settings: Settings = get_settings()
    _validate_storage_settings(settings)
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
        ),
    )
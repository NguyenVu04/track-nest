from __future__ import annotations

from io import BufferedIOBase
from typing import Any
from uuid import UUID

from botocore.exceptions import ClientError

from src.util.settings import Settings, get_settings
from .setup import get_s3_client

class StorageService:
    def __init__(self, client: Any | None = None):
        self.settings: Settings = get_settings()
        self.client = client or get_s3_client()
        self.bucket = self.settings.s3_bucket_name

    def upload_file(
        self,
        file: BufferedIOBase,
        document_id: UUID,
        file_name: str,
        content_type: str,
    ) -> str:
        key = self._build_key(document_id, file_name)
        if hasattr(file, "seek"):
            file.seek(0)

        upload_kwargs: dict[str, str] = {}
        normalized_content_type = self._normalize_content_type(content_type)
        if normalized_content_type:
            upload_kwargs["ContentType"] = normalized_content_type

        body = file.read()
        self.client.put_object(Bucket=self.bucket, Key=key, Body=body, **upload_kwargs)
        return key

    def _normalize_content_type(self, content_type: str | None) -> str | None:
        if not content_type:
            return None

        normalized = str(content_type).strip()
        # Guard against unsafe header values that break request serialization.
        if not normalized or "\r" in normalized or "\n" in normalized:
            return None

        return normalized

    def _build_key(
            self, 
            document_id: UUID, 
            file_name: str
    ) -> str:
        normalized_file_name = str(file_name).replace("\\", "/").lstrip("/")
        return f"{document_id}/{normalized_file_name}"

    def read_file(
            self, 
            document_id: UUID, 
            file_name: str
    ) -> bytes:
        key = self._build_key(document_id, file_name)
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read()

    def delete_file(
            self, 
            document_id: UUID, 
            file_name: str
    ) -> None:
        key = self._build_key(document_id, file_name)
        self.client.delete_object(Bucket=self.bucket, Key=key)

    def file_exists(
            self,
            document_id: UUID,
            file_name: str,
    ) -> bool:
        key = self._build_key(document_id, file_name)
        try:
            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as exc:
            error_code = str(exc.response.get("Error", {}).get("Code", ""))
            if error_code in {"404", "NoSuchKey", "NotFound"}:
                return False
            raise

    def generate_presigned_url(
        self,
        document_id: UUID,
        file_name: str,
        expires_in: int | None = None,
    ) -> str:
        key = self._build_key(document_id, file_name)
        expiration = expires_in or self.settings.s3_presign_expiration
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expiration,
        )
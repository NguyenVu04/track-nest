from __future__ import annotations

import ssl

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from src.util.settings import Settings, get_settings


def _build_ssl_context(settings: Settings) -> ssl.SSLContext | None:
    if not settings.kafka_ca_cert_path:
        return None
    from pathlib import Path
    from src.util.settings import BASE_DIR
    path = Path(settings.kafka_ca_cert_path)
    if not path.is_absolute():
        path = BASE_DIR / path
    return ssl.create_default_context(cafile=path)


def _kafka_params(settings: Settings, ssl_context: ssl.SSLContext | None) -> dict:
    params: dict = {
        "bootstrap_servers": settings.kafka_bootstrap_servers,
        "security_protocol": "SASL_SSL" if ssl_context else "PLAINTEXT",
    }
    if ssl_context:
        params["ssl_context"] = ssl_context
        params["sasl_mechanism"] = settings.kafka_sasl_mechanism
        params["sasl_plain_username"] = settings.kafka_sasl_username
        params["sasl_plain_password"] = settings.kafka_sasl_password
    return params


def create_kafka_consumer() -> AIOKafkaConsumer:
    settings: Settings = get_settings()
    return AIOKafkaConsumer(
        settings.kafka_location_topic,
        group_id=settings.kafka_group_id,
        auto_offset_reset="latest",
        enable_auto_commit=True,
        **_kafka_params(settings, _build_ssl_context(settings)),
    )


def create_kafka_producer() -> AIOKafkaProducer:
    settings: Settings = get_settings()
    return AIOKafkaProducer(
        **_kafka_params(settings, _build_ssl_context(settings)),
    )

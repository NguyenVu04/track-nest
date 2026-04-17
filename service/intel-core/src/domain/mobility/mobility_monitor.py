from __future__ import annotations

import asyncio
import json
import logging

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from src.ai.anomaly_detector import AnomalyDetector
from src.domain.mobility.location_message import LocationMessage
from src.domain.mobility.tracking_notification_message import TrackingNotificationMessage
from src.util.logging import get_logger
from src.util.settings import Settings, get_settings

logger: logging.Logger = get_logger(__name__)

_NOTIFICATION_TYPE = "MOBILITY_ANOMALY"

class MobilityMonitor:
    """Consumes location events, runs anomaly detection, and emits notifications."""

    def __init__(
        self,
        detector: AnomalyDetector,
        consumer: AIOKafkaConsumer,
        producer: AIOKafkaProducer,
    ) -> None:
        self._detector = detector
        self._consumer = consumer
        self._producer = producer
        self._settings: Settings = get_settings()

    async def start(self) -> None:
        """Start consuming. Runs until the task is cancelled."""
        try:
            await self._consumer.start()
            await self._producer.start()
            logger.info("MobilityMonitor started", extra={"topic": self._settings.kafka_location_topic})
            async for msg in self._consumer:
                if msg.value is None:
                    continue
                await self._handle(msg.value)
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.error(
                "MobilityMonitor failed to connect — Kafka unavailable, monitor disabled",
                extra={"error": str(exc)},
            )
        finally:
            await self._consumer.stop()
            await self._producer.stop()
            logger.info("MobilityMonitor stopped")

    async def _handle(self, raw: bytes) -> None:
        try:
            location = LocationMessage.model_validate(json.loads(raw))
        except Exception as exc:
            logger.warning(
                "Skipping malformed location message",
                extra={"error": str(exc)},
            )
            return

        try:
            if await self._detector.is_anomaly(location):
                await self._notify(location)
        except Exception as exc:
            logger.error(
                "Anomaly detection failed",
                extra={"userId": str(location.userId), "error": str(exc)},
            )

    async def _notify(self, location: LocationMessage) -> None:
        notification = TrackingNotificationMessage(
            targetId=location.userId,
            title="Mobility Anomaly Detected",
            content=(
                f"Anomalous movement detected for {location.username} "
                f"at {location.latitudeDeg:.5f}°, {location.longitudeDeg:.5f}°)."
            ),
            type=_NOTIFICATION_TYPE,
        )
        payload = json.dumps(notification.model_dump(mode="json")).encode("utf-8")
        await self._producer.send(self._settings.kafka_notification_topic, payload)
        logger.info(
            "Anomaly notification sent",
            extra={"userId": str(location.userId), "username": location.username},
        )

from __future__ import annotations

from enum import Enum

from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, String, Text, func, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.configuration.database.setup import Base

class ChatMessageRole(str, Enum):
    USER = "USER"
    MODEL = "MODEL"

class ChatMessage(Base):
    __tablename__ = "chat_message"
    __table_args__ = (
        CheckConstraint(
            f"role IN ('{ChatMessageRole.USER.value}', '{ChatMessageRole.MODEL.value}')",
            name="ck_chat_message_role",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    session_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), 
        nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[ChatMessageRole] = mapped_column(String(15), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

from configuration.database.postgresql import AsyncSessionLocal

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
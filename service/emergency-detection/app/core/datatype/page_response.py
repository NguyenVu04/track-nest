from typing import List, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar('T')

class PageResponse(BaseModel, Generic[T]):
    total_items: int = Field(..., description="Total number of items available", examples=[1])
    total_pages: int = Field(..., description="Total number of pages available", examples=[1])
    current_page: int = Field(..., description="Current page number", examples=[1])
    page_size: int = Field(..., description="Number of items per page", examples=[1])
    items: List[T] = Field(..., description="List of items for the current page")

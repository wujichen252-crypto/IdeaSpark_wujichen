"""
Pagination utilities.
Mimics Spring Data Pageable semantics (page=1-based, size).
"""
from dataclasses import dataclass
from typing import Generic, TypeVar, List, Optional

T = TypeVar('T')


@dataclass
class Page(Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int

    @property
    def total_pages(self) -> int:
        if self.size == 0:
            return 0
        return (self.total + self.size - 1) // self.size

    @property
    def has_next(self) -> bool:
        return self.page < self.total_pages

    @property
    def has_previous(self) -> bool:
        return self.page > 1


def validate_pagination(page: Optional[int], size: Optional[int]) -> tuple:
    """Validate and normalize page/size. Returns (page, size)."""
    if page is None or page < 1:
        page = 1
    if size is None or size <= 0:
        size = 20
    if size > 200:
        size = 200
    return page, size


def paginate_queryset(queryset, page: int, size: int):
    """Slice a Django QuerySet with 1-based pagination. Returns Page."""
    total = queryset.count()
    offset = (page - 1) * size
    items = list(queryset[offset:offset + size])
    return Page(items=items, total=total, page=page, size=size)

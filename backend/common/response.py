"""
Unified API response format.
Maps to the Spring Boot { "status": 200, "message": "...", "data": {...} } contract.
Frontend Axios expects this exact shape.
"""
from typing import Any
from ninja import Schema


class ApiResponse(Schema):
    status: int = 200
    message: str = "success"
    data: Any = None


class ApiResponseData(Schema):
    """Generic wrapper for data field when it's a single object/value."""

    @staticmethod
    def ok(data: Any = None, message: str = "success") -> dict:
        return {"status": 200, "message": message, "data": data}

    @staticmethod
    def created(data: Any = None, message: str = "创建成功") -> dict:
        return {"status": 200, "message": message, "data": data}

    @staticmethod
    def error(message: str = "请求失败", status: int = 400, data: Any = None) -> dict:
        return {"status": status, "message": message, "data": data}

    @staticmethod
    def paginated(items: list, total: int, page: int, size: int) -> dict:
        return {
            "status": 200,
            "message": "获取成功",
            "data": {
                "items": items,
                "total": total,
                "page": page,
                "size": size,
            },
        }

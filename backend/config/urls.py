"""
IdeaSpark URL configuration.
Django Ninja API router — maps all /api/ endpoints.
"""
from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from django.http import HttpResponse

from apps.accounts.api import router as accounts_router
from apps.projects.api import router as projects_router
from apps.teams.api import router as teams_router
from apps.community.api import router as community_router
from apps.ai.api import router as ai_router
from apps.notifications.api import router as notifications_router
from apps.files.api import router as files_router
from apps.security_logs.api import router as security_logs_router
from common.exceptions import BusinessException, NotFoundException, ForbiddenException, UnauthorizedException
from common.response import ApiResponseData

api = NinjaAPI(
    title="IdeaSpark API",
    version="1.0.0",
    description="AI-driven project incubator backend",
    docs_url="/docs/",
)


@api.exception_handler(BusinessException)
def handle_business_exception(request, exc):
    return api.create_response(
        request,
        {"status": 400, "message": str(exc), "data": None},
        status=400,
    )


@api.exception_handler(NotFoundException)
def handle_not_found(request, exc):
    return api.create_response(
        request,
        {"status": 404, "message": str(exc), "data": None},
        status=404,
    )


@api.exception_handler(ForbiddenException)
def handle_forbidden(request, exc):
    return api.create_response(
        request,
        {"status": 403, "message": str(exc), "data": None},
        status=403,
    )


@api.exception_handler(UnauthorizedException)
def handle_unauthorized(request, exc):
    return api.create_response(
        request,
        {"status": 401, "message": str(exc), "data": None},
        status=401,
    )


# ── System routes ─────────────────────────────────────

@api.get('/', auth=None)
def root(request):
    return ApiResponseData.ok(data={
        'version': '1.0.0',
        'docs': '/docs/',
    }, message='IdeaSpark API')


@api.get('/ping', auth=None)
def ping(request):
    return ApiResponseData.ok(data='pong', message='OK')


@api.get('/api', auth=None)
def api_root(request):
    return ApiResponseData.ok(data={'user': '/api/user'})


@api.get('/metrics', auth=None)
def metrics(request):
    """Prometheus metrics endpoint — used by monitoring systems."""
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)


# ── Module routers ────────────────────────────────────

api.add_router('/', accounts_router, tags=["用户管理"])
api.add_router('/', projects_router, tags=["项目管理"])
api.add_router('/', teams_router, tags=["团队管理"])
api.add_router('/', community_router, tags=["社区管理"])
api.add_router('/', ai_router, tags=["AI功能"])
api.add_router('/', notifications_router, tags=["消息通知"])
api.add_router('/', files_router, tags=["文件管理"])
api.add_router('/', security_logs_router, tags=["安全日志"])

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', api.urls),
]

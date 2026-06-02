"""
AI API router — DeepSeek chat, project generation, editing.
Maps Java: com.ideaspark.project.controller.AIController
"""
import logging

from django.http import HttpRequest
from ninja import Router

from apps.accounts.auth import AuthBearer
from apps.ai.schemas import (
    ChatRequestIn, SimpleChatIn,
    GenerateProjectIn, TechAdviceIn, AiEditIn,
)
from apps.ai import services
from common.response import ApiResponseData

logger = logging.getLogger(__name__)

router = Router()


@router.post('/api/ai/chat', auth=AuthBearer())
def chat(request: HttpRequest, payload: ChatRequestIn):
    """AI 聊天"""
    messages = [{'role': m.role, 'content': m.content} for m in payload.messages]
    result = services.chat(messages, payload.model, payload.temperature)
    return ApiResponseData.ok(data=result, message='Success')


@router.post('/api/ai/chat/simple', auth=AuthBearer())
def chat_simple(request: HttpRequest, payload: SimpleChatIn):
    """简单对话"""
    result = services.chat_simple(payload.message)
    return ApiResponseData.ok(data=result, message='Success')


@router.post('/api/ai/generate-project', auth=AuthBearer())
def generate_project(request: HttpRequest, payload: GenerateProjectIn):
    """生成项目方案"""
    result = services.generate_project(payload.prompt)
    return ApiResponseData.ok(data=result, message='Success')


@router.post('/api/ai/tech-advice', auth=AuthBearer())
def tech_advice(request: HttpRequest, payload: TechAdviceIn):
    """获取技术选型建议"""
    result = services.tech_advice(payload.requirements)
    return ApiResponseData.ok(data=result, message='Success')


@router.get('/api/ai/models', auth=AuthBearer())
def ai_models(request: HttpRequest):
    """获取 AI 模型列表"""
    result = services.get_models()
    return ApiResponseData.ok(data=result, message='Success')


@router.get('/api/ai/status', auth=None)
def ai_status(request: HttpRequest):
    """检查 AI 服务状态"""
    result = services.check_status()
    return ApiResponseData.ok(data=result, message='Success')


@router.post('/api/ai/edit', auth=AuthBearer())
def ai_edit(request: HttpRequest, payload: AiEditIn):
    """AI 编辑助手"""
    result = services.ai_edit(payload.fileType, payload.content, payload.action, payload.selectedText)
    return ApiResponseData.ok(data=result, message='Success')

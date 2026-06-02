"""AI business logic service."""
import time

from common.exceptions import BusinessException
from apps.ai import deepseek as ds


def chat(messages: list, model: str = None, temperature: float = None) -> dict:
    """Send chat messages to DeepSeek."""
    ds.check_quota(0, 'chat', ds.CHAT_HOURLY_LIMIT)

    if not ds.is_configured():
        return _unconfigured_response('AI 服务未配置，请联系管理员配置 DeepSeek API Key')

    deepseek_messages = [{'role': m['role'], 'content': m['content']} for m in messages]

    if len(deepseek_messages) > 20:
        raise BusinessException('消息上下文过长，最多20条')

    total_len = sum(len(m['content']) for m in deepseek_messages)
    if total_len > 8000:
        raise BusinessException('输入内容总长度不能超过8000字符')

    result = ds.chat(deepseek_messages, model, temperature)
    if not result:
        return _unconfigured_response('AI 服务未配置')

    return result


def chat_simple(message: str) -> dict:
    """Simple single-message chat."""
    ds.check_quota(0, 'simple', ds.SIMPLE_CHAT_HOURLY_LIMIT)

    if not message or not message.strip():
        raise BusinessException('消息不能为空')
    if len(message) > 2000:
        raise BusinessException('消息长度不能超过2000字符')

    if not ds.is_configured():
        return {'content': 'AI 服务未配置，请联系管理员配置 DeepSeek API Key', 'timestamp': _ts()}

    response = ds.chat_simple(message)
    return {'content': response or '抱歉，AI 服务暂时不可用，请稍后重试。', 'timestamp': _ts()}


def generate_project(prompt: str) -> dict:
    """Generate project plan."""
    ds.check_quota(0, 'generate', ds.GENERATE_PROJECT_HOURLY_LIMIT)

    if not prompt or not prompt.strip():
        raise BusinessException('项目描述不能为空')
    if len(prompt) > 2000:
        raise BusinessException('项目描述长度不能超过2000字符')

    if not ds.is_configured():
        return {'content': 'AI 服务未配置，请联系管理员配置 DeepSeek API Key', 'timestamp': _ts()}

    response = ds.generate_project(prompt)
    return {'content': response or '抱歉，项目生成服务暂时不可用。', 'timestamp': _ts()}


def tech_advice(requirements: str) -> dict:
    """Get tech stack advice."""
    ds.check_quota(0, 'tech', ds.TECH_ADVICE_HOURLY_LIMIT)

    if not requirements or not requirements.strip():
        raise BusinessException('需求描述不能为空')
    if len(requirements) > 2000:
        raise BusinessException('需求描述长度不能超过2000字符')

    if not ds.is_configured():
        return {'content': 'AI 服务未配置，请联系管理员配置 DeepSeek API Key', 'timestamp': _ts()}

    response = ds.tech_stack_advice(requirements)
    return {'content': response or '抱歉，技术选型建议服务暂时不可用。', 'timestamp': _ts()}


def ai_edit(file_type: str, content: str, action: str, selected_text: str = None) -> dict:
    """AI-assisted editing."""
    ds.check_quota(0, 'edit', ds.EDIT_HOURLY_LIMIT)

    if len(content) > 8000:
        raise BusinessException('内容长度不能超过8000字符')

    if not ds.is_configured():
        return {
            'content': 'AI 服务未配置，请联系管理员配置 DeepSeek API Key',
            'action': action,
            'timestamp': _ts(),
        }

    response = ds.edit_content(file_type, content, action, selected_text)
    return {
        'content': response or '抱歉，AI 编辑服务暂时不可用。',
        'action': action,
        'timestamp': _ts(),
    }


def get_models() -> list:
    """Get list of supported AI models."""
    return [
        {'id': 'deepseek-chat', 'name': 'DeepSeek-V3', 'description': '通用对话模型，适用于大多数场景'},
        {'id': 'deepseek-reasoner', 'name': 'DeepSeek-R1', 'description': '推理模型，适用于复杂问题求解'},
    ]


def check_status() -> dict:
    """Check AI service status."""
    available = ds.is_configured()
    return {'available': available}


def _unconfigured_response(msg: str) -> dict:
    return {
        'message': {
            'role': 'assistant',
            'content': msg,
            'timestamp': _ts(),
        }
    }


def _ts() -> int:
    return int(time.time() * 1000)

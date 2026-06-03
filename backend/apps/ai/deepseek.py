"""
DeepSeek API client.
Replaces Java: com.ideaspark.project.service.DeepSeekService
"""
import logging
import time
from typing import Optional, List

from django.conf import settings
from openai import OpenAI

logger = logging.getLogger(__name__)

# Rate limits (per user per hour)
CHAT_HOURLY_LIMIT = 50
SIMPLE_CHAT_HOURLY_LIMIT = 100
GENERATE_PROJECT_HOURLY_LIMIT = 20
TECH_ADVICE_HOURLY_LIMIT = 30
EDIT_HOURLY_LIMIT = 50


def get_client() -> Optional[OpenAI]:
    """Get OpenAI-compatible client for DeepSeek."""
    api_key = getattr(settings, 'DEEPSEEK_API_KEY', None) or getattr(settings, 'OPENAI_API_KEY', None)
    if not api_key:
        return None
    base_url = getattr(settings, 'DEEPSEEK_BASE_URL', 'https://api.deepseek.com')
    return OpenAI(api_key=api_key, base_url=base_url)


def is_configured() -> bool:
    """Check if DeepSeek API is configured."""
    return get_client() is not None


def _default_model() -> str:
    return getattr(settings, 'DEEPSEEK_MODEL', 'deepseek-chat')


def chat(messages: List[dict], model: str = None, temperature: float = None) -> Optional[dict]:
    """Send chat messages to DeepSeek API."""
    client = get_client()
    if not client:
        return None

    kwargs = {
        'model': model or _default_model(),
        'messages': messages,
    }
    if temperature is not None:
        kwargs['temperature'] = temperature

    try:
        response = client.chat.completions.create(**kwargs)
        choice = response.choices[0]
        return {
            'message': {
                'role': choice.message.role,
                'content': choice.message.content or '',
            },
            'usage': {
                'prompt_tokens': response.usage.prompt_tokens if response.usage else 0,
                'completion_tokens': response.usage.completion_tokens if response.usage else 0,
                'total_tokens': response.usage.total_tokens if response.usage else 0,
            } if response.usage else None,
        }
    except Exception as e:
        logger.error(f'DeepSeek API call failed: {e}')
        raise


def chat_simple(message: str) -> Optional[str]:
    """Simple single-message chat."""
    result = chat([
        {'role': 'user', 'content': message},
    ])
    if result:
        return result['message']['content']
    return None


def generate_project(prompt: str) -> Optional[str]:
    """Generate a project plan based on prompt."""
    system_msg = '你是一个创业项目孵化专家。请根据用户的需求描述，生成一份完整的项目方案，包括：项目概述、市场分析、功能规划、技术架构、实施路线图。请用中文回复。'
    result = chat([
        {'role': 'system', 'content': system_msg},
        {'role': 'user', 'content': prompt},
    ])
    if result:
        return result['message']['content']
    return None


def tech_stack_advice(requirements: str) -> Optional[str]:
    """Get tech stack recommendations."""
    system_msg = '你是一个资深技术架构师。请根据用户的需求，推荐合适的技术栈，并说明选择理由。请用中文回复。'
    result = chat([
        {'role': 'system', 'content': system_msg},
        {'role': 'user', 'content': requirements},
    ])
    if result:
        return result['message']['content']
    return None


def edit_content(file_type: str, content: str, action: str, selected_text: Optional[str] = None) -> Optional[str]:
    """AI-assisted content editing."""
    action_prompts = {
        'rewrite': '请重写以下内容，保持核心信息不变但改进表达方式',
        'polish': '请润色以下内容，改进语法、用词和流畅度',
        'expand': '请扩展以下内容，补充更多细节和深度',
        'outline': '请为以下内容生成一个大纲结构',
        'summary': '请总结以下内容的核心要点',
        'formula': '请将以下内容中的数学公式用LaTeX格式化',
        'continue': '请继续以下内容的写作',
        'format': '请美化以下内容的格式',
        'analyze': '请分析以下内容的关键主题和观点',
        'design': '请为以下内容提供设计建议',
        'notes': '请将以下内容整理成笔记格式',
        'generate': '请根据描述生成内容',
        'translate': '请将以下内容翻译成中文',
        'clean': '请清理以下内容，去除冗余和不规范的部分',
        'chart': '请为以下数据生成图表描述',
    }

    prompt_template = action_prompts.get(action, '请处理以下内容')
    system_msg = f'{prompt_template}。{"重点关注选中的文本：" + selected_text if selected_text else ""}'

    result = chat([
        {'role': 'system', 'content': system_msg},
        {'role': 'user', 'content': content},
    ])
    if result:
        return result['message']['content']
    return None


# ── Quota (simplified in-memory, replace with Redis in production) ──

from threading import Lock
_quota_store: dict = {}  # key: f"{user_id}:{category}", value: list of timestamps
_quota_lock = Lock()


def check_quota(user_id: int, category: str, limit: int):
    """Check if user has exceeded hourly quota. Raises exception if exceeded."""
    from common.exceptions import BusinessException
    global _quota_store

    # 添加线程锁防止竞态条件
    with _quota_lock:
        key = f'{user_id}:{category}'
        now = time.time()
        timestamps = _quota_store.get(key, [])
        # Keep only timestamps within the last hour
        timestamps = [t for t in timestamps if now - t < 3600]
        if len(timestamps) >= limit:
            raise BusinessException(f'请求过于频繁，请稍后再试（每小时限制{limit}次）')
        timestamps.append(now)
        _quota_store[key] = timestamps

        # 定期清理旧数据，防止内存泄漏
        if now % 300 < 1:  # 每5分钟左右清理一次
            _cleanup_quota_store(now)


def _cleanup_quota_store(now: float):
    """Cleanup old entries from quota store."""
    global _quota_store
    keys_to_delete = []
    for key, timestamps in _quota_store.items():
        # 清理超过1小时的记录
        timestamps = [t for t in timestamps if now - t < 3600]
        if not timestamps:
            keys_to_delete.append(key)
        else:
            _quota_store[key] = timestamps
    for key in keys_to_delete:
        del _quota_store[key]

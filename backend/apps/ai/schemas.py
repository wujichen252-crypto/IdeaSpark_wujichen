"""Pydantic schemas for AI module."""
from typing import Optional, List
from ninja import Schema


class ChatMessageIn(Schema):
    role: str
    content: str


class ChatRequestIn(Schema):
    messages: List[ChatMessageIn]
    model: Optional[str] = None
    temperature: Optional[float] = None


class SimpleChatIn(Schema):
    message: str


class GenerateProjectIn(Schema):
    prompt: str


class TechAdviceIn(Schema):
    requirements: str


class AiEditIn(Schema):
    fileType: str = 'md'
    content: str = ''
    action: str = 'polish'
    selectedText: Optional[str] = None

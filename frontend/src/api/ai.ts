/**
 * AI 功能接口
 * @description 封装 AI 模块的所有 HTTP 请求方法（DeepSeek）
 */
import service from './request'
import type { ApiResponse } from './types'

/**
 * AI 聊天消息
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
}

/**
 * AI 聊天请求
 */
export interface ChatRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
}

/**
 * AI 聊天响应
 */
export interface ChatResponse {
  message: ChatMessage
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * AI 生成项目请求
 */
export interface GenerateProjectRequest {
  prompt: string
}

/**
 * 简单对话请求
 */
export interface SimpleChatRequest {
  message: string
}

/**
 * AI 模型信息
 */
export interface AIModel {
  id: string
  name: string
  description: string
}

/**
 * 发送 AI 聊天消息（完整上下文）
 * @param params - 聊天请求参数
 */
export function sendChatMessage(params: ChatRequest) {
  return service.post<ApiResponse<ChatResponse>>('/api/ai/chat', params)
}

/**
 * 简单对话（单条消息，无需维护上下文）
 * @param message - 用户消息
 */
export function sendSimpleChat(message: string) {
  return service.post<ApiResponse<{ content: string; timestamp: number }>>('/api/ai/chat/simple', {
    message
  })
}

/**
 * AI 生成项目方案
 * @param prompt - 项目描述
 */
export function generateProject(prompt: string) {
  return service.post<ApiResponse<{ content: string; timestamp: number }>>('/api/ai/generate-project', {
    prompt
  })
}

/**
 * 获取技术选型建议
 * @param requirements - 需求描述
 */
export function getTechAdvice(requirements: string) {
  return service.post<ApiResponse<{ content: string; timestamp: number }>>('/api/ai/tech-advice', {
    requirements
  })
}

/**
 * 获取 AI 模型列表
 */
export function getAIModels() {
  return service.get<ApiResponse<AIModel[]>>('/api/ai/models')
}

/**
 * 检查 AI 服务状态
 */
export function checkAIStatus() {
  return service.get<ApiResponse<{ available: boolean }>>('/api/ai/status')
}

/**
 * AI 编辑助手请求
 */
export interface AiEditRequest {
  fileType: 'md' | 'doc' | 'xlsx' | 'pptx'
  content: string
  action: 'rewrite' | 'polish' | 'expand' | 'outline' | 'summary' | 'formula' | 'continue' | 'format' | 'analyze' | 'design' | 'notes' | 'generate' | 'translate' | 'clean' | 'chart'
  selectedText?: string
}

/**
 * AI 编辑助手响应
 */
export interface AiEditResponse {
  content: string
  action: string
  timestamp: number
}

/**
 * AI 编辑助手 - 根据文件类型提供针对性的编辑建议
 * @param params - 编辑请求参数
 */
export function editAi(params: AiEditRequest) {
  return service.post<ApiResponse<AiEditResponse>>('/api/ai/edit', params)
}


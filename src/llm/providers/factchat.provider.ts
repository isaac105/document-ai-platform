import { Injectable, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ILLMProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class FactChatProvider implements ILLMProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly embeddingDimension = 1536;
  private readonly chatPath: string;
  private readonly embeddingPath: string;
  private readonly embeddingModel: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.getOrThrow<string>('LLM_BASE_URL');
    this.apiKey = this.configService.getOrThrow<string>('LLM_API_KEY');
    this.defaultModel = this.configService.getOrThrow<string>('LLM_MODEL');
    this.chatPath = this.configService.getOrThrow<string>('LLM_CHAT_PATH');
    this.embeddingPath = this.configService.getOrThrow<string>('LLM_EMBEDDING_PATH');
    this.embeddingModel = this.configService.getOrThrow<string>('LLM_EMBEDDING_MODEL');
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const url = `${this.baseUrl}${this.chatPath}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model || this.defaultModel,
          messages: request.messages,
          // temperature: request.temperature || 0.7,
          // max_tokens: request.max_tokens || 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        // 외부 LLM 호출 실패 시, 개발 환경에서는 간단한 폴백 응답을 반환
        const fallback = this.buildFallbackChatResponse(request, error);
        if (fallback) {
          return fallback;
        }
        throw new HttpException(
          `FactChat API Error: ${error}`,
          response.status,
        );
      }

      const data = await response.json();

      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: data.usage,
      };
    } catch (error) {
      const fallback = this.buildFallbackChatResponse(request, error.message);
      if (fallback) {
        return fallback;
      }
      throw new HttpException(
        `Failed to communicate with FactChat: ${error.message}`,
        500,
      );
    }
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const url = `${this.baseUrl}${this.embeddingPath}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model: this.embeddingModel,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        // 404 등 임베딩 엔드포인트 미구현/오류 시 로컬 임베딩으로 폴백
        return this.generateLocalEmbedding(text);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      // 외부 호출 실패 시에도 서비스 전체가 죽지 않도록 로컬 임베딩 생성
      return this.generateLocalEmbedding(text);
    }
  }

  private buildFallbackChatResponse(
    request: ChatCompletionRequest,
    reason: string,
  ): ChatCompletionResponse | null {
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      return null;
    }

    const lastMessage = request.messages[request.messages.length - 1];
    const userContent = lastMessage?.content ?? '';

    return {
      content:
        `⚠️ (로컬 폴백 응답)\n` +
        `실제 LLM 호출에 실패했습니다: ${reason}\n\n` +
        `요청하신 내용에 대해 간단히 정리한 원문입니다:\n\n` +
        userContent,
      model: 'local-fallback',
    };
  }

  private generateLocalEmbedding(text: string): number[] {
    const vec = new Array(this.embeddingDimension).fill(0);
    const normalized = text || '';

    for (let i = 0; i < normalized.length; i++) {
      const code = normalized.charCodeAt(i);
      const idx = code % this.embeddingDimension;
      vec[idx] += 1;
    }

    // 간단한 정규화
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}


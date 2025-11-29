import { Injectable, Inject } from '@nestjs/common';
import type {
  ILLMProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from './interfaces/llm-provider.interface';

@Injectable()
export class LlmService {
  constructor(
    @Inject('LLM_PROVIDER')
    private readonly llmProvider: ILLMProvider,
  ) {}

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.llmProvider.chat(request);
  }

  async embedText(text: string): Promise<number[]> {
    return this.llmProvider.embedText(text);
  }

  // 문서 질의응답을 위한 헬퍼 메서드
  async answerQuestion(
    question: string,
    context: string,
  ): Promise<string> {
    const response = await this.chat({
      messages: [
        {
          role: 'system',
          content: '당신은 사내 문서를 분석하여 정확한 답변을 제공하는 AI 어시스턴트입니다.',
        },
        {
          role: 'user',
          content: `다음 문서 내용을 참고하여 질문에 답변해주세요.

문서 내용:
${context}

질문: ${question}`,
        },
      ],
    });

    return response.content;
  }
}

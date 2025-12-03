import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from './llm.service';
import type {
  ILLMProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from './interfaces/llm-provider.interface';

describe('LlmService', () => {
  let service: LlmService;
  let provider: {
    chat: jest.Mock<Promise<ChatCompletionResponse>, [ChatCompletionRequest]>;
    embedText: jest.Mock<Promise<number[]>, [string]>;
  };

  beforeEach(async () => {
    provider = {
      chat: jest.fn(),
      embedText: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: 'LLM_PROVIDER',
          useValue: provider as ILLMProvider,
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  it('chat 이 provider.chat 을 호출한다', async () => {
    provider.chat.mockResolvedValue({
      content: 'hello',
      model: 'test-model',
    });

    const res = await service.chat({
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(provider.chat).toHaveBeenCalled();
    expect(res.content).toBe('hello');
  });

  it('embedText 가 provider.embedText 를 호출한다', async () => {
    provider.embedText.mockResolvedValue([0.1, 0.2, 0.3]);

    const vec = await service.embedText('text');

    expect(provider.embedText).toHaveBeenCalledWith('text');
    expect(vec).toEqual([0.1, 0.2, 0.3]);
  });

  it('answerQuestion 이 적절한 system/user 메시지를 구성한다', async () => {
    provider.chat.mockImplementation(async (req: ChatCompletionRequest) => {
      const system = req.messages[0];
      const user = req.messages[1];

      expect(system.role).toBe('system');
      expect(system.content).toContain('사내 문서');
      expect(user.role).toBe('user');
      expect(user.content).toContain('질문: 무엇인가요?');

      return { content: '답변', model: 'test' };
    });

    const answer = await service.answerQuestion(
      '무엇인가요?',
      '문서 내용입니다.',
    );

    expect(answer).toBe('답변');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { QaService } from './qa.service';
import { Document, DocumentStatus } from '../documents/entities/document.entity';
import { LlmService } from '../llm/llm.service';

type MockRepo<T extends ObjectLiteral> = Partial<Record<keyof Repository<T>, jest.Mock>>;

function createMockRepo<T extends ObjectLiteral>(): MockRepo<T> {
  return {
    createQueryBuilder: jest.fn(),
  };
}

describe('QaService', () => {
  let service: QaService;
  let documentRepo: MockRepo<Document>;
  let llmService: { answerQuestion: jest.Mock };

  beforeEach(async () => {
    documentRepo = createMockRepo<Document>();
    llmService = { answerQuestion: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QaService,
        {
          provide: getRepositoryToken(Document),
          useValue: documentRepo,
        },
        {
          provide: LlmService,
          useValue: llmService,
        },
      ],
    }).compile();

    service = module.get<QaService>(QaService);
  });

  it('최신 completed 문서를 기반으로 컨텍스트를 생성하고 LLM 을 호출한다', async () => {
    const qb: any = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          originalName: 'guide.txt',
          team: 'platform',
          summary: '요약 내용',
          content: '원문 내용',
          status: DocumentStatus.COMPLETED,
        } as Document,
      ]),
    };

    (documentRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    llmService.answerQuestion.mockResolvedValue('AI 답변');

    const result = await service.ask('회사 이름이 뭐야?', 'platform');

    expect(documentRepo.createQueryBuilder).toHaveBeenCalledWith('document');
    expect(llmService.answerQuestion).toHaveBeenCalledWith(
      '회사 이름이 뭐야?',
      expect.stringContaining('guide.txt'),
    );
    expect(result.answer).toBe('AI 답변');
    expect(result.sources).toHaveLength(1);
  });
}
);
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Document } from '../documents/entities/document.entity';
import { LlmService } from '../llm/llm.service';

@Injectable()
export class QaService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly llmService: LlmService,
  ) {}

  async ask(question: string, team?: string): Promise<{
    answer: string;
    sources: Document[];
  }> {
    const documents = await this.findRecentDocuments(team);

    const context = documents.length
      ? documents
          .map((doc) => {
            const contentPreview = (doc.summary || doc.content || '')
              .slice(0, 1200)
              .trim();
            return `문서: ${doc.originalName}\n팀: ${
              doc.team ?? '미지정'
            }\n내용: ${contentPreview}`;
          })
          .join('\n---\n')
      : '참조 가능한 문서가 없습니다.';

    const answer = await this.llmService.answerQuestion(
      question,
      context || '참조 가능한 문서가 없습니다.',
    );

    return {
      answer,
      sources: documents,
    };
  }

  private findRecentDocuments(team?: string): Promise<Document[]> {
    let query: SelectQueryBuilder<Document> =
      this.documentRepository.createQueryBuilder('document');

    query = query
      .where('document.status = :status', { status: 'completed' })
      .orderBy('document.updatedAt', 'DESC')
      .take(3);

    if (team) {
      query = query.andWhere('document.team = :team', { team });
    }

    return query.getMany();
  }
}

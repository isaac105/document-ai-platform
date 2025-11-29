import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetDocumentsQuery } from '../impl/get-documents.query';
import { Document } from '../../entities/document.entity';

@QueryHandler(GetDocumentsQuery)
export class GetDocumentsHandler implements IQueryHandler<GetDocumentsQuery> {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async execute(query: GetDocumentsQuery): Promise<{
    documents: Document[];
    total: number;
  }> {
    const { team, status, page, limit } = query;

    const queryBuilder = this.documentRepository.createQueryBuilder('document');

    // 필터링
    if (team) {
      queryBuilder.andWhere('document.team = :team', { team });
    }

    if (status) {
      queryBuilder.andWhere('document.status = :status', { status });
    }

    // 정렬
    queryBuilder.orderBy('document.createdAt', 'DESC');

    // 페이지네이션
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [documents, total] = await queryBuilder.getManyAndCount();

    return { documents, total };
  }
}

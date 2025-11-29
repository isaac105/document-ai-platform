import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetDocumentQuery } from '../impl/get-document.query';
import { Document } from '../../entities/document.entity';

@QueryHandler(GetDocumentQuery)
export class GetDocumentHandler implements IQueryHandler<GetDocumentQuery> {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async execute(query: GetDocumentQuery): Promise<Document | null> {
    return this.documentRepository.findOne({
      where: { id: query.documentId },
    });
  }
}

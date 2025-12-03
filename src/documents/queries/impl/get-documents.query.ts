import { DocumentStatus } from '../../entities/document.entity';

export class GetDocumentsQuery {
  constructor(
    public readonly team?: string,
    public readonly status?: DocumentStatus,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

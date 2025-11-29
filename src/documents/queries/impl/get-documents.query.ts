export class GetDocumentsQuery {
  constructor(
    public readonly team?: string,
    public readonly status?: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

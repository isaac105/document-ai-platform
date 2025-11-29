export class DocumentUploadedEvent {
  constructor(
    public readonly documentId: string,
    public readonly filePath: string,
  ) {}
}

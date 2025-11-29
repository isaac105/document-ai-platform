export class UploadDocumentCommand {
  constructor(
    public readonly file: Express.Multer.File,
    public readonly team?: string,
    public readonly uploadedBy?: string,
  ) {}
}

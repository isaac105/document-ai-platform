export class DocumentResponseDto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  status: string;
  summary?: string;
  team?: string;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(document: any): DocumentResponseDto {
    return {
      id: document.id,
      filename: document.filename,
      originalName: document.originalName,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      status: document.status,
      summary: document.summary,
      team: document.team,
      uploadedBy: document.uploadedBy,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}

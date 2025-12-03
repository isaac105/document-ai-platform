import { Document, DocumentStatus } from '../entities/document.entity';

export class DocumentResponseDto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  summary?: string;
  team?: string;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(document: Document): DocumentResponseDto {
    return {
      id: document.id,
      filename: document.filename,
      originalName: document.originalName,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      status: document.status,
      summary: document.summary ?? undefined,
      team: document.team ?? undefined,
      uploadedBy: document.uploadedBy ?? undefined,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}

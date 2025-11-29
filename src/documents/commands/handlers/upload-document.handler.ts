import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadDocumentCommand } from '../impl/upload-document.command';
import { Document } from '../../entities/document.entity';
import { DocumentUploadedEvent } from '../../events/impl/document-uploaded.event';
import { ConfigService } from '@nestjs/config';
import { DocumentStorageService } from '../../services/document-storage.service';

@CommandHandler(UploadDocumentCommand)
export class UploadDocumentHandler
  implements ICommandHandler<UploadDocumentCommand>
{
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private eventBus: EventBus,
    private configService: ConfigService,
    private readonly storageService: DocumentStorageService,
  ) {}

  async execute(command: UploadDocumentCommand): Promise<Document> {
    const { file, team, uploadedBy } = command;

    // 파일 저장
    const { filename, filePath } = await this.storageService.saveFile(file);

    // Document 엔티티 생성
    const document = this.documentRepository.create({
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath,
      content: '', // 아직 파싱 전
      status: 'pending',
      team,
      uploadedBy,
    });

    // DB에 저장
    const savedDocument = await this.documentRepository.save(document);

    // 이벤트 발행 (비동기 처리를 위해)
    this.eventBus.publish(
      new DocumentUploadedEvent(savedDocument.id, savedDocument.filePath),
    );

    return savedDocument;
  }
}

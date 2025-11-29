import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessDocumentCommand } from '../impl/process-document.command';
import { Document } from '../../entities/document.entity';
import { DocumentChunk } from '../../entities/document-chunk.entity';
import { Logger } from '@nestjs/common';
import { DocumentProcessingService } from '../../services/document-processing.service';

@CommandHandler(ProcessDocumentCommand)
export class ProcessDocumentHandler
  implements ICommandHandler<ProcessDocumentCommand>
{
  private readonly logger = new Logger(ProcessDocumentHandler.name);

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(DocumentChunk)
    private chunkRepository: Repository<DocumentChunk>,
    private readonly processingService: DocumentProcessingService,
  ) {}

  async execute(command: ProcessDocumentCommand): Promise<void> {
    const { documentId } = command;

    try {
      // 문서 조회
      const document = await this.documentRepository.findOne({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      // 상태 업데이트
      document.status = 'processing';
      await this.documentRepository.save(document);

      // 1. 파일 파싱
      this.logger.log(`Parsing document: ${document.filename}`);
      const content = await this.processingService.extractContent(document);

      document.content = content;
      await this.documentRepository.save(document);

      // 2. 텍스트 청킹
      this.logger.log(`Chunking document: ${document.filename}`);
      const chunkSegments = this.processingService.splitIntoChunks(content);

      // 3. 각 청크에 대해 임베딩 생성 및 저장
      this.logger.log(
        `Generating embeddings for ${chunkSegments.length} chunks`,
      );

      const preparedChunks =
        await this.processingService.embedChunks(chunkSegments);

      const chunkEntities = preparedChunks.map((chunk) =>
        this.chunkRepository.create({
          documentId: document.id,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          startPosition: chunk.startPosition,
          endPosition: chunk.endPosition,
          embedding: JSON.stringify(chunk.embedding),
        }),
      );

      if (chunkEntities.length) {
        await this.chunkRepository.save(chunkEntities);
      }

      // 4. 문서 요약 생성
      this.logger.log(`Generating summary for: ${document.filename}`);
      const summary = await this.processingService.summarize(content);
      document.summary = summary;

      // 5. 완료 상태로 업데이트
      document.status = 'completed';
      await this.documentRepository.save(document);

      this.logger.log(`Document processing completed: ${document.filename}`);
    } catch (error) {
      this.logger.error(
        `Failed to process document ${documentId}:`,
        error.stack,
      );

      // 실패 상태로 업데이트
      await this.documentRepository.update(documentId, {
        status: 'failed',
      });
    }
  }

}

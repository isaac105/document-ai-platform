import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
  Query,
  ParseUUIDPipe,
  NotFoundException,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Buffer } from 'buffer';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UploadDocumentCommand } from './commands/impl/upload-document.command';
import { GetDocumentQuery } from './queries/impl/get-document.query';
import { GetDocumentsQuery } from './queries/impl/get-documents.query';
import { DocumentResponseDto } from './dto/document-response.dto';
import { DocumentParserService } from './services/document-parser.service';
import { ConfigService } from '@nestjs/config';
import { DocumentFiltersDto } from './dto/document-filters.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';

@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly parserService: DocumentParserService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata?: UploadDocumentDto,
  ): Promise<DocumentResponseDto> {
    // 파일 존재 여부 확인
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // 파일 크기 검증
    const maxSize = this.configService.get<number>('MAX_FILE_SIZE') ?? 10485760;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      );
    }

    // 한글 깨짐 해결
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')

    // 파일 타입 검증
    if (!this.parserService.isValidFileType(file.mimetype, file.originalname)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: PDF, DOC, DOCX, TXT',
      );
    }

    // Command 실행
    const document = await this.commandBus.execute(
      new UploadDocumentCommand(file, metadata?.team, metadata?.uploadedBy),
    );

    return DocumentResponseDto.fromEntity(document);
  }

  @Get()
  async getDocuments(
    @Query() filters: DocumentFiltersDto,
  ): Promise<{
    data: DocumentResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { team, status, page, limit } = filters;
    const result = await this.queryBus.execute(
      new GetDocumentsQuery(team, status, page, limit),
    );

    return {
      data: result.documents.map(DocumentResponseDto.fromEntity),
      total: result.total,
      page,
      limit,
    };
  }

  @Get(':id')
  async getDocument(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.queryBus.execute(new GetDocumentQuery(id));

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return DocumentResponseDto.fromEntity(document);
  }

  @Get(':id/content')
  async getDocumentContent(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ content: string }> {
    const document = await this.queryBus.execute(new GetDocumentQuery(id));

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return { content: document.content };
  }

  @Get(':id/chunks')
  async getDocumentChunks(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<any[]> {
    // 추후 Query 구현
    return [];
  }

  @Sse('events/stream')
  documentsEvents(): Observable<MessageEvent> {
    return new Observable((observer) => {
      const handler = (payload: unknown) =>
        observer.next({ data: payload } as MessageEvent);
      this.eventEmitter.on('documents.updated', handler);
      return () => this.eventEmitter.off('documents.updated', handler);
    });
  }
}

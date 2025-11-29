import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entities
import { Document } from './entities/document.entity';
import { DocumentChunk } from './entities/document-chunk.entity';

// Controller
import { DocumentsController } from './documents.controller';

// Services
import { DocumentParserService } from './services/document-parser.service';
import { DocumentStorageService } from './services/document-storage.service';
import { DocumentProcessingService } from './services/document-processing.service';

// Command Handlers
import { CommandHandlers } from './commands/handlers';

// Query Handlers
import { QueryHandlers } from './queries/handlers';

// Event Handlers
import { EventHandlers } from './events/handlers';

// LLM Module
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    TypeOrmModule.forFeature([Document, DocumentChunk]),
    LlmModule,
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentParserService,
    DocumentStorageService,
    DocumentProcessingService,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [TypeOrmModule],
})
export class DocumentsModule {}

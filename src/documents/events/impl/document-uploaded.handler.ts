import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { DocumentUploadedEvent } from '../impl/document-uploaded.event';
import { ProcessDocumentCommand } from '../../commands/impl/process-document.command';
import { Logger } from '@nestjs/common';

@EventsHandler(DocumentUploadedEvent)
export class DocumentUploadedHandler
  implements IEventHandler<DocumentUploadedEvent>
{
  private readonly logger = new Logger(DocumentUploadedHandler.name);

  constructor(private commandBus: CommandBus) {}

  async handle(event: DocumentUploadedEvent) {
    this.logger.log(`Document uploaded: ${event.documentId}`);

    // 비동기로 문서 처리 시작
    await this.commandBus.execute(new ProcessDocumentCommand(event.documentId));
  }
}

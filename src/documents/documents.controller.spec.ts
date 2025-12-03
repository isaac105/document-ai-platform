import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DocumentParserService } from './services/document-parser.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { UploadDocumentCommand } from './commands/impl/upload-document.command';
import { DocumentResponseDto } from './dto/document-response.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };
  let parserService: { isValidFileType: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };
    parserService = { isValidFileType: jest.fn() };
    configService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        { provide: DocumentParserService, useValue: parserService },
        { provide: ConfigService, useValue: configService },
        { provide: EventEmitter2, useValue: { emit: jest.fn(), on: jest.fn(), off: jest.fn() } },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  it('파일이 없으면 BadRequestException 을 던진다', async () => {
    await expect(
      controller.uploadDocument(null as any, { team: 'dev', uploadedBy: 'me' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('파일 크기가 최대값을 넘으면 BadRequestException', async () => {
    const file = {
      size: 11 * 1024 * 1024,
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
    } as Express.Multer.File;
    configService.get.mockReturnValue(10 * 1024 * 1024);

    await expect(
      controller.uploadDocument(file, { team: 'dev', uploadedBy: 'me' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('유효한 파일이면 UploadDocumentCommand 를 실행한다', async () => {
    const file = {
      size: 1024,
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('dummy'),
    } as Express.Multer.File;

    configService.get.mockReturnValue(10 * 1024 * 1024);
    parserService.isValidFileType.mockReturnValue(true);

    const fakeDocument = {
      id: 'doc-id',
      filename: 'stored.pdf',
      originalName: 'test.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    commandBus.execute.mockResolvedValue(fakeDocument);

    const result = await controller.uploadDocument(file, {
      team: 'dev',
      uploadedBy: 'me',
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(UploadDocumentCommand),
    );
    expect(result).toEqual(DocumentResponseDto.fromEntity(fakeDocument));
  });
});
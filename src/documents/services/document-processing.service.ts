import { Injectable, Logger } from '@nestjs/common';
import { Document } from '../entities/document.entity';
import { DocumentParserService } from './document-parser.service';
import { LlmService } from '../../llm/llm.service';

export interface PreparedChunk {
  chunkIndex: number;
  content: string;
  startPosition: number;
  endPosition: number;
  embedding: number[];
}

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);
  private readonly chunkSize = 500;
  private readonly chunkOverlap = 100;

  constructor(
    private readonly parserService: DocumentParserService,
    private readonly llmService: LlmService,
  ) {}

  async extractContent(document: Document): Promise<string> {
    return this.parserService.parseFile(document.filePath, document.mimeType);
  }

  splitIntoChunks(content: string): Array<{
    chunkIndex: number;
    content: string;
    startPosition: number;
    endPosition: number;
  }> {
    const normalized = content.replace(/\s+/g, ' ').trim();
    const chunks: Array<{
      chunkIndex: number;
      content: string;
      startPosition: number;
      endPosition: number;
    }> = [];

    if (!normalized.length) {
      return chunks;
    }

    // 내용이 청크 크기보다 짧으면 한 번만 반환
    if (normalized.length <= this.chunkSize) {
      chunks.push({
        chunkIndex: 0,
        content: normalized,
        startPosition: 0,
        endPosition: normalized.length,
      });
      return chunks;
    }

    const step = Math.max(1, this.chunkSize - this.chunkOverlap);
    let index = 0;

    for (let start = 0; start < normalized.length; start += step) {
      const end = Math.min(start + this.chunkSize, normalized.length);
      const slice = normalized.slice(start, end).trim();

      chunks.push({
        chunkIndex: index,
        content: slice,
        startPosition: start,
        endPosition: end,
      });

      index += 1;
      if (end === normalized.length) {
        break;
      }
    }

    return chunks;
  }

  async embedChunks(
    chunks: Array<{
      chunkIndex: number;
      content: string;
      startPosition: number;
      endPosition: number;
    }>,
  ): Promise<PreparedChunk[]> {
    const prepared: PreparedChunk[] = [];

    for (const chunk of chunks) {
      const embedding = await this.llmService.embedText(chunk.content);
      prepared.push({
        ...chunk,
        embedding,
      });
    }

    return prepared;
  }

  async summarize(content: string): Promise<string> {
    if (!content.trim()) {
      return '';
    }

    const maxContentLength = 3000;
    const truncatedContent = content.substring(0, maxContentLength);

    const response = await this.llmService.chat({
      messages: [
        {
          role: 'system',
          content: '당신은 문서를 간결하게 요약하는 전문가입니다.',
        },
        {
          role: 'user',
          content: `다음 문서를 3-5문장으로 요약해주세요:\n\n${truncatedContent}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    return response.content;
  }
}


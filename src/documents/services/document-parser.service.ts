import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as path from 'path';

@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);

  async parseFile(filePath: string, mimeType: string): Promise<string> {
    this.logger.log(`Parsing file: ${filePath} (${mimeType})`);

    try {
      const extension = path.extname(filePath).toLowerCase();

      switch (extension) {
        case '.pdf':
          return await this.parsePdf(filePath);
        case '.docx':
          return await this.parseDocx(filePath);
        case '.doc':
          return await this.parseDoc(filePath);
        case '.txt':
          return await this.parseTxt(filePath);
        default:
          throw new Error(`Unsupported file type: ${extension}`);
      }
    } catch (error) {
      this.logger.error(`Failed to parse file: ${filePath}`, error.stack);
      throw error;
    }
  }

  private async parsePdf(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: dataBuffer });

    try {
      const data = await parser.getText();
      return this.cleanText(data.text);
    } finally {
      await parser.destroy().catch((error) =>
        this.logger.warn(`Failed to destroy PDF parser instance: ${error}`),
      );
    }
  }

  private async parseDocx(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return this.cleanText(result.value);
  }

  private async parseDoc(filePath: string): Promise<string> {
    // .doc 파일은 mammoth로 직접 처리하기 어려움
    // 실제 프로덕션에서는 LibreOffice나 다른 변환 도구 필요
    this.logger.warn('.doc format support is limited');

    try {
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return this.cleanText(result.value);
    } catch (error) {
      throw new Error(
        '.doc format is not fully supported. Please use .docx format.',
      );
    }
  }

  private async parseTxt(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return this.cleanText(content);
  }

  private cleanText(text: string): string {
    return (
      text
        // 연속된 공백을 하나로
        .replace(/\s+/g, ' ')
        // 연속된 줄바꿈을 최대 2개로
        .replace(/\n{3,}/g, '\n\n')
        // 앞뒤 공백 제거
        .trim()
    );
  }

  // 파일 타입 검증
  isValidFileType(mimeType: string, filename: string): boolean {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const extension = path.extname(filename).toLowerCase();

    return (
      allowedMimeTypes.includes(mimeType) ||
      allowedExtensions.includes(extension)
    );
  }
}

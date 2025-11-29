import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class DocumentStorageService {
  private readonly uploadPath: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadPath =
      this.configService.get<string>('UPLOAD_PATH') ??
      path.join(process.cwd(), 'uploads');
  }

  async saveFile(
    file: Express.Multer.File,
  ): Promise<{ filename: string; filePath: string }> {
    await fs.mkdir(this.uploadPath, { recursive: true });

    const fileExtension = path.extname(file.originalname);
    const filename = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, filename);

    await fs.writeFile(filePath, file.buffer);

    return { filename, filePath };
  }
}


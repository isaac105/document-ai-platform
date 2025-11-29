import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UploadDocumentDto {
  @IsNotEmpty()
  @IsString()
  filename: string;

  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsString()
  uploadedBy?: string;
}

import { IsString, IsOptional } from 'class-validator';

export class UploadDocumentDto {
  @IsOptional()
  @IsString()
  team?: string;

  @IsOptional()
  @IsString()
  uploadedBy?: string;
}

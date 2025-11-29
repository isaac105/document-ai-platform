import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AskQuestionDto {
  @IsNotEmpty()
  @IsString()
  question: string;

  @IsOptional()
  @IsString()
  team?: string;
}


import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.DEVELOPMENT;

  @IsNumber()
  @Min(1)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @IsNumber()
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_DATABASE: string;

  @IsString()
  @IsNotEmpty()
  LLM_BASE_URL: string;

  @IsString()
  @IsNotEmpty()
  LLM_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  LLM_MODEL: string;

  @IsString()
  @IsNotEmpty()
  LLM_CHAT_PATH: string;

  @IsString()
  @IsNotEmpty()
  LLM_EMBEDDING_PATH: string;

  @IsString()
  @IsNotEmpty()
  LLM_EMBEDDING_MODEL: string;

  @IsOptional()
  @IsString()
  UPLOAD_PATH?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  MAX_FILE_SIZE?: number;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}


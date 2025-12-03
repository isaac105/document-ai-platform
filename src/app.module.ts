import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import databaseConfig from './config/database.config';
import { validate } from './config/env.validation';

// 생성한 모듈들
import { DocumentsModule } from './documents/documents.module';
import { QueriesModule } from './queries/queries.module';
import { VectorstoreModule } from './vectorstore/vectorstore.module';
import { LlmModule } from './llm/llm.module';
import { FaviconController } from './common/controllers/favicon.controller';
import { WellKnownController } from './app.controller';

@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
      validate,
    }),
    EventEmitterModule.forRoot(),

    // TypeORM 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<TypeOrmModuleOptions>('database'),
      inject: [ConfigService],
    }),

    // 도메인 모듈들
    DocumentsModule,
    QueriesModule,
    VectorstoreModule,
    LlmModule,
  ],
  controllers: [FaviconController, WellKnownController],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Document } from '../documents/entities/document.entity';
import { LlmModule } from '../llm/llm.module';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';

@Module({
  imports: [TypeOrmModule.forFeature([Document]), LlmModule],
  controllers: [QaController],
  providers: [QaService],
})
export class QueriesModule {}

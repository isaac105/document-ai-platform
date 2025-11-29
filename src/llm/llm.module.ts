import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FactChatProvider } from './providers/factchat.provider';
import { LlmService } from './llm.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'LLM_PROVIDER',
      useClass: FactChatProvider,
    },
    LlmService,
  ],
  exports: [LlmService],
})
export class LlmModule {}

import { Body, Controller, Post } from '@nestjs/common';
import { DocumentResponseDto } from '../documents/dto/document-response.dto';
import { AskQuestionDto } from './dto/ask-question.dto';
import { QaService } from './qa.service';

@Controller('qa')
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @Post('ask')
  async askQuestion(
    @Body() askQuestionDto: AskQuestionDto,
  ): Promise<{
    answer: string;
    sources: DocumentResponseDto[];
  }> {
    const result = await this.qaService.ask(
      askQuestionDto.question,
      askQuestionDto.team,
    );

    return {
      answer: result.answer,
      sources: result.sources.map(DocumentResponseDto.fromEntity),
    };
  }
}


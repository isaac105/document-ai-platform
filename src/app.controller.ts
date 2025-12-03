import { Controller, Get, HttpCode } from '@nestjs/common';

// 개발자 도구 404 대응용 컨트롤러
@Controller('/.well-known/appspecific')
export class WellKnownController {
  @Get('com.chrome.devtools.json')
  @HttpCode(204) // 내용 없음
  ignoreDevtools() {
    return;
  }
}

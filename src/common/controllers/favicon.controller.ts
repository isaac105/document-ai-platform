import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { createReadStream } from 'fs';

@Controller()
export class FaviconController {
  @Get('favicon.ico')
  serveFavicon(@Res() res: Response) {
    const faviconPath = join(process.cwd(), 'public', 'favicon.svg');
    res.type('image/svg+xml');
    createReadStream(faviconPath).pipe(res);
  }
}

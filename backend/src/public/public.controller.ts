import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PublicService } from './public.service';
import { AiService } from './ai.service';
import { SpeechService } from './speech.service';
import { CreateOrderDto } from '../orders/dto/order.dto';
import { AiChatDto } from './dto/ai-chat.dto';
import { TtsDto } from './dto/tts.dto';

// Auth talab qilinmaydi — mijoz QR skaner qilib kiradi
@Controller('public')
export class PublicController {
  constructor(
    private readonly service: PublicService,
    private readonly ai: AiService,
    private readonly speech: SpeechService,
  ) {}

  @Get('menu/:tableCode')
  getMenu(@Param('tableCode') tableCode: string) {
    return this.service.getMenuByTableCode(tableCode);
  }

  @Post('orders')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.service.createOrder(dto);
  }

  // Ovozli AI ofitsiant bilan suhbat
  @Post('menu/:tableCode/ai')
  aiChat(@Param('tableCode') tableCode: string, @Body() dto: AiChatDto) {
    return this.ai.chat(tableCode, dto.messages, dto.cart);
  }

  // Matnni o'zbek ovoziga aylantirish (Aisha TTS) — audio qaytaradi
  @Post('tts')
  async tts(@Body() dto: TtsDto, @Res() res: Response) {
    const { audio, mime } = await this.speech.synthesize(dto.text);
    res.set({
      'Content-Type': mime,
      'Content-Length': String(audio.length),
      'Cache-Control': 'no-store',
    });
    res.send(audio);
  }
}

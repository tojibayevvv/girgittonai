import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { AiService } from './ai.service';
import { SpeechService } from './speech.service';
import { PublicController } from './public.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [PublicController],
  providers: [PublicService, AiService, SpeechService],
})
export class PublicModule {}

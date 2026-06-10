import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PublicService } from './public.service';
import { CreateOrderDto } from '../orders/dto/order.dto';

// Auth talab qilinmaydi — mijoz QR skaner qilib kiradi
@Controller('public')
export class PublicController {
  constructor(private readonly service: PublicService) {}

  @Get('menu/:tableCode')
  getMenu(@Param('tableCode') tableCode: string) {
    return this.service.getMenuByTableCode(tableCode);
  }

  @Post('orders')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.service.createOrder(dto);
  }
}

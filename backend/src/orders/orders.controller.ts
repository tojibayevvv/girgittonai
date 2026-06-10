import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RESTAURANT_ADMIN', 'STAFF')
@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  findAll(
    @CurrentUser('restaurantId') restaurantId: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.service.findAll(restaurantId, status);
  }

  @Get(':id')
  findOne(
    @CurrentUser('restaurantId') restaurantId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(restaurantId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateStatus(restaurantId, id, dto.status);
  }
}

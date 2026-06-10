import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RESTAURANT_ADMIN', 'STAFF')
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  findAll(
    @CurrentUser('restaurantId') restaurantId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.service.findAll(restaurantId, categoryId);
  }

  @Roles('RESTAURANT_ADMIN')
  @Post()
  create(
    @CurrentUser('restaurantId') restaurantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.service.create(restaurantId, dto);
  }

  @Roles('RESTAURANT_ADMIN')
  @Patch(':id')
  update(
    @CurrentUser('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.service.update(restaurantId, id, dto);
  }

  @Roles('RESTAURANT_ADMIN')
  @Delete(':id')
  remove(
    @CurrentUser('restaurantId') restaurantId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(restaurantId, id);
  }
}

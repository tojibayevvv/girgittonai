import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RESTAURANT_ADMIN', 'STAFF')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  findAll(@CurrentUser('restaurantId') restaurantId: string) {
    return this.service.findAll(restaurantId);
  }

  @Roles('RESTAURANT_ADMIN')
  @Post()
  create(
    @CurrentUser('restaurantId') restaurantId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.service.create(restaurantId, dto);
  }

  @Roles('RESTAURANT_ADMIN')
  @Patch(':id')
  update(
    @CurrentUser('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
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

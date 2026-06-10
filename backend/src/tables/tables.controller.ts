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
import { TablesService } from './tables.service';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RESTAURANT_ADMIN', 'STAFF')
@Controller('tables')
export class TablesController {
  constructor(private readonly service: TablesService) {}

  @Get()
  findAll(@CurrentUser('restaurantId') restaurantId: string) {
    return this.service.findAll(restaurantId);
  }

  @Roles('RESTAURANT_ADMIN')
  @Post()
  create(
    @CurrentUser('restaurantId') restaurantId: string,
    @Body() dto: CreateTableDto,
  ) {
    return this.service.create(restaurantId, dto);
  }

  @Roles('RESTAURANT_ADMIN')
  @Patch(':id')
  update(
    @CurrentUser('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.service.update(restaurantId, id, dto);
  }

  @Roles('RESTAURANT_ADMIN')
  @Post(':id/regenerate-code')
  regenerate(
    @CurrentUser('restaurantId') restaurantId: string,
    @Param('id') id: string,
  ) {
    return this.service.regenerateCode(restaurantId, id);
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

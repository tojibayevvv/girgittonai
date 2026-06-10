import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  UpdateRestaurantStatusDto,
} from './dto/super-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly service: SuperAdminService) {}

  @Get('stats')
  stats() {
    return this.service.stats();
  }

  @Get('restaurants')
  listRestaurants() {
    return this.service.listRestaurants();
  }

  @Get('restaurants/:id')
  getRestaurant(@Param('id') id: string) {
    return this.service.getRestaurant(id);
  }

  @Patch('restaurants/:id/status')
  setStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantStatusDto,
  ) {
    return this.service.setRestaurantStatus(id, dto.status);
  }

  @Get('plans')
  listPlans() {
    return this.service.listPlans();
  }

  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.service.createPlan(dto);
  }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.service.updatePlan(id, dto);
  }

  @Get('payments')
  listPayments() {
    return this.service.listPayments();
  }
}

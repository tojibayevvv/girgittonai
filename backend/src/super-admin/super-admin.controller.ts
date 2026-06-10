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
import { SuperAdminService } from './super-admin.service';
import {
  CreatePlanDto,
  CreateRestaurantDto,
  ResetPasswordDto,
  UpdatePlanDto,
  UpdateRestaurantDto,
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

  @Post('restaurants')
  createRestaurant(@Body() dto: CreateRestaurantDto) {
    return this.service.createRestaurant(dto);
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

  @Patch('restaurants/:id')
  updateRestaurant(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.service.updateRestaurant(id, dto);
  }

  @Delete('restaurants/:id')
  deleteRestaurant(@Param('id') id: string) {
    return this.service.deleteRestaurant(id);
  }

  @Post('restaurants/:id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.service.resetPassword(id, dto);
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

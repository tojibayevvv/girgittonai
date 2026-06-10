import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { UpdateRestaurantDto } from './dto/restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RESTAURANT_ADMIN', 'STAFF')
@Controller('restaurant')
export class RestaurantsController {
  constructor(private readonly service: RestaurantsService) {}

  @Get('me')
  findMine(@CurrentUser('restaurantId') restaurantId: string) {
    return this.service.findMine(restaurantId);
  }

  @Roles('RESTAURANT_ADMIN')
  @Patch('me')
  update(
    @CurrentUser('restaurantId') restaurantId: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.service.update(restaurantId, dto);
  }
}

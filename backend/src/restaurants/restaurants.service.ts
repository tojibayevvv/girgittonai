import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateRestaurantDto } from './dto/restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async findMine(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { products: true, tables: true, orders: true } },
      },
    });
    if (!restaurant) throw new NotFoundException('Restoran topilmadi');
    return restaurant;
  }

  update(restaurantId: string, dto: UpdateRestaurantDto) {
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: dto,
    });
  }
}

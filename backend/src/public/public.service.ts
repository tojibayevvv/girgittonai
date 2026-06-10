import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/order.dto';

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    private orders: OrdersService,
  ) {}

  // Stol kodi (QR) orqali menyuni ochish
  async getMenuByTableCode(tableCode: string) {
    const table = await this.prisma.table.findUnique({
      where: { code: tableCode },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            currency: true,
            status: true,
          },
        },
      },
    });

    if (!table || !table.isActive) {
      throw new NotFoundException('Stol topilmadi');
    }

    const categories = await this.prisma.category.findMany({
      where: { restaurantId: table.restaurant.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { isAvailable: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      table: { id: table.id, name: table.name, code: table.code },
      restaurant: table.restaurant,
      categories,
    };
  }

  async createOrder(dto: CreateOrderDto) {
    const table = await this.prisma.table.findUnique({
      where: { code: dto.tableCode },
      select: { restaurantId: true },
    });
    if (!table) throw new NotFoundException('Stol topilmadi');
    return this.orders.createFromClient(table.restaurantId, dto);
  }
}

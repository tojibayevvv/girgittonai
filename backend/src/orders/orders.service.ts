import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // ----- Admin tomoni -----

  findAll(restaurantId: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: { restaurantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        table: { select: { id: true, name: true } },
        items: true,
      },
    });
  }

  async findOne(restaurantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, restaurantId },
      include: { table: true, items: true },
    });
    if (!order) throw new NotFoundException('Buyurtma topilmadi');
    return order;
  }

  async updateStatus(restaurantId: string, id: string, status: OrderStatus) {
    await this.findOne(restaurantId, id);
    return this.prisma.order.update({ where: { id }, data: { status } });
  }

  // ----- Mijoz (client) tomoni -----

  async createFromClient(restaurantId: string, dto: CreateOrderDto) {
    const table = await this.prisma.table.findFirst({
      where: { code: dto.tableCode, restaurantId, isActive: true },
    });
    if (!table) {
      throw new BadRequestException('Stol topilmadi yoki faol emas');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, restaurantId, isAvailable: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'Ba’zi mahsulotlar mavjud emas yoki sotuvda yo‘q',
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let total = new Prisma.Decimal(0);
    const itemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const lineTotal = product.price.mul(item.quantity);
      total = total.add(lineTotal);
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      };
    });

    // Restoran ichidagi ketma-ket buyurtma raqami
    const count = await this.prisma.order.count({ where: { restaurantId } });

    return this.prisma.order.create({
      data: {
        restaurantId,
        tableId: table.id,
        orderNumber: count + 1,
        status: 'PENDING',
        total,
        note: dto.note,
        items: { create: itemsData },
      },
      include: { items: true, table: { select: { name: true } } },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(restaurantId: string, categoryId?: string) {
    return this.prisma.product.findMany({
      where: { restaurantId, ...(categoryId ? { categoryId } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  create(restaurantId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: { ...dto, restaurantId },
    });
  }

  private async ensureOwned(restaurantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, restaurantId },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    return product;
  }

  async update(restaurantId: string, id: string, dto: UpdateProductDto) {
    await this.ensureOwned(restaurantId, id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(restaurantId: string, id: string) {
    await this.ensureOwned(restaurantId, id);
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }
}

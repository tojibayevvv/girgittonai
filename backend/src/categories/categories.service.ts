import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  create(restaurantId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: { ...dto, restaurantId },
    });
  }

  private async ensureOwned(restaurantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, restaurantId },
    });
    if (!category) throw new NotFoundException('Kategoriya topilmadi');
    return category;
  }

  async update(restaurantId: string, id: string, dto: UpdateCategoryDto) {
    await this.ensureOwned(restaurantId, id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(restaurantId: string, id: string) {
    await this.ensureOwned(restaurantId, id);
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }
}

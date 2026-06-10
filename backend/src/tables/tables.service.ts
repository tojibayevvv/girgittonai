import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  private generateCode(): string {
    // QR ichidagi noyob token
    return randomBytes(8).toString('hex');
  }

  findAll(restaurantId: string) {
    return this.prisma.table.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(restaurantId: string, dto: CreateTableDto) {
    return this.prisma.table.create({
      data: { ...dto, restaurantId, code: this.generateCode() },
    });
  }

  private async ensureOwned(restaurantId: string, id: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, restaurantId },
    });
    if (!table) throw new NotFoundException('Stol topilmadi');
    return table;
  }

  async update(restaurantId: string, id: string, dto: UpdateTableDto) {
    await this.ensureOwned(restaurantId, id);
    return this.prisma.table.update({ where: { id }, data: dto });
  }

  // QR kodi tokenini yangilash (eski QR ishlamay qoladi)
  async regenerateCode(restaurantId: string, id: string) {
    await this.ensureOwned(restaurantId, id);
    return this.prisma.table.update({
      where: { id },
      data: { code: this.generateCode() },
    });
  }

  async remove(restaurantId: string, id: string) {
    await this.ensureOwned(restaurantId, id);
    await this.prisma.table.delete({ where: { id } });
    return { ok: true };
  }
}

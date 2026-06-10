import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Ma\'lumotlar bazasiga ulanildi.');
    } catch (error) {
      // Hozircha DB sozlanmagan bo'lishi mumkin (deploy'da Railway DB ulanadi).
      // Server qulamasligi uchun xatoni log qilamiz, lekin bootni to'xtatmaymiz.
      this.logger.warn(
        `Ma'lumotlar bazasiga ulanib bo'lmadi (server baribir ishga tushadi): ${
          (error as Error).message
        }`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import sharp from 'sharp';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RESTAURANT_ADMIN')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 }, // yuklashda 8MB gacha (siqishdan oldin)
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Faqat rasm yuklash mumkin'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('Fayl topilmadi');

    // Optimizatsiya: eng ko'pi 1000px ga kichraytirib, webp formatida siqamiz.
    // Shu tufayli bazadagi hajm kichik (odatda ~30-150KB) bo'ladi.
    const optimized = await sharp(file.buffer)
      .rotate() // EXIF orientatsiyasini to'g'rilaydi
      .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const image = await this.prisma.uploadedImage.create({
      data: { mime: 'image/webp', data: optimized },
      select: { id: true },
    });

    const forwarded = (req.headers['x-forwarded-proto'] as string | undefined)
      ?.split(',')[0]
      ?.trim();
    const proto = forwarded || req.protocol;
    const base = `${proto}://${req.get('host')}`;
    return { url: `${base}/api/uploads/${image.id}` };
  }
}

import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

// Rasmni ko'rsatish uchun ochiq (public) endpoint — mijoz menyusi himoyasiz.
@Controller('uploads')
export class ImagesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async serve(@Param('id') id: string, @Res() res: Response) {
    const image = await this.prisma.uploadedImage.findUnique({
      where: { id },
      select: { mime: true, data: true },
    });
    if (!image) throw new NotFoundException('Rasm topilmadi');

    res.setHeader('Content-Type', image.mime);
    // Rasm o'zgarmaydi (id noyob) — uzoq muddat keshlaymiz.
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(image.data);
  }
}

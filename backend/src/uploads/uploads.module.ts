import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { ImagesController } from './images.controller';

@Module({
  controllers: [UploadsController, ImagesController],
})
export class UploadsModule {}

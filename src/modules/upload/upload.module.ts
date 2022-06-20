import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploaderService } from './uploader.service';

@Module({
  controllers: [UploadController],
  providers: [UploaderService],
})
export class UploadModule {}

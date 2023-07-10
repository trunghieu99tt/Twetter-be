import { Module } from '@nestjs/common';
import { LinkPreviewService } from './link-preview.service';
import { LinkPreviewController } from './link-preview.controller';

@Module({
  imports: [],
  controllers: [LinkPreviewController],
  providers: [LinkPreviewService],
})
export class LinkPreviewModule {}

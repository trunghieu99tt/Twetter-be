import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { LinkPreviewService } from './link-preview.service';
import { ResponseTool } from 'src/tools/response.tool';

@Controller('link-preview')
export class LinkPreviewController {
  @Inject()
  private readonly linkPreviewService: LinkPreviewService;

  @Get()
  async getLinkMetadata(@Query('url') url: string) {
    const metadata = await this.linkPreviewService.getLinkMetadata(url);
    return ResponseTool.GET_OK(metadata);
  }
}

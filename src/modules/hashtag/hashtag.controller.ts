import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ResponseTool } from 'src/tools/response.tool';
import { HashtagService } from './hashtag.service';

@Controller('hashtag')
export class HashtagController {
  @Inject()
  private readonly hashtagService: HashtagService;

  @Get('/most-popular')
  async getMostPopularHashtags() {
    const popularHashtags = await this.hashtagService.getMostPopularHashtags(
      10,
    );
    return ResponseTool.GET_OK(popularHashtags);
  }

  @Patch('/:name')
  async updateHashtag(
    @Body()
    body: {
      count: number;
    },
    @Param('name') name: string,
  ) {
    const updatedHashtag = await this.hashtagService.updateHashtag(
      body.count,
      name,
    );
    return ResponseTool.PATCH_OK(updatedHashtag);
  }
}

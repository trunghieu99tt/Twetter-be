import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiQueryGetMany,
  QueryGet,
} from 'src/common/decorators/common.decorator';
import { MyTokenAuthGuard } from 'src/common/guards/token.guard';
import { QueryPostOption } from 'src/tools/request.tool';
import { ResponseTool } from 'src/tools/response.tool';
import { GetUser } from '../user/decorator/getUser.decorator';
import { UserDocument } from '../user/user.entity';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(MyTokenAuthGuard)
  @ApiQueryGetMany()
  async search(
    @GetUser() user: UserDocument,
    @Query() querySearch,
    @QueryGet() query: QueryPostOption,
  ) {
    const { data, total } = await this.searchService.search(
      user,
      {
        search: querySearch.search,
        category: querySearch.category,
      },
      query,
    );

    return ResponseTool.GET_OK(data, total);
  }
}

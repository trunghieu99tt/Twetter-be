import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import {
    ApiQueryGetMany,
    QueryGet,
} from 'src/common/decorators/common.decorator';
import { QueryPostOption } from 'src/tools/request.tool';
import { ResponseTool } from 'src/tools/response.tool';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) {}

    @Get()
    @ApiQueryGetMany()
    async search(@Query() querySearch, @QueryGet() query: QueryPostOption) {
        const { data, total } = await this.searchService.search(
            {
                search: querySearch.search,
                category: querySearch.category,
            },
            query,
        );

        return ResponseTool.GET_OK(data, total);
    }
}

import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import {
    ApiQueryGetMany,
    QueryGet,
} from 'src/common/decorators/common.decorator';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { MyTokenAuthGuard } from 'src/common/guards/token.guard';
import { QueryPostOption } from 'src/tools/request.tool';
import { ResponseTool } from 'src/tools/response.tool';
import { GetUser } from '../user/decorator/getUser.decorator';
import { UserDocument } from '../user/user.entity';
import { StoryDTO } from './story.dto';
import { StoryService } from './story.service';

@Controller('/story')
export class StoryController {
    constructor(private readonly storyService: StoryService) {}

    @Post('')
    @ApiResponse({
        type: ResponseDTO,
    })
    @UseGuards(MyTokenAuthGuard)
    async createStory(
        @GetUser() user: UserDocument,
        @Body() createStoryDto: StoryDTO,
    ): Promise<ResponseDTO> {
        const newStory = await this.storyService.createStory(
            createStoryDto,
            user,
        );
        return ResponseTool.POST_OK(newStory);
    }

    @Get('')
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getStories(
        @GetUser() user: UserDocument,
        @QueryGet() query: QueryPostOption,
    ): Promise<ResponseDTO> {
        const stories = await this.storyService.getStories(user, query.options);
        return ResponseTool.GET_OK(stories);
    }

    @Patch('/:id')
    @UseGuards(MyTokenAuthGuard)
    async updateStory(
        @GetUser() user: UserDocument,
        @Param('id') id: string,
    ): Promise<ResponseDTO> {
        const updatedStory = await this.storyService.updateStory(id, user);
        return ResponseTool.PATCH_OK(updatedStory);
    }

    @Delete('/:id')
    @UseGuards(MyTokenAuthGuard)
    async deleteStory(
        @GetUser() user: UserDocument,
        @Param('id') id: string,
    ): Promise<ResponseDTO> {
        const deletedStory = await this.storyService.deleteStory(id, user);
        return ResponseTool.DELETE_OK(deletedStory);
    }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiQueryGetMany, QueryGet } from 'src/common/decorators/common.decorator';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { MyTokenAuthGuard } from 'src/common/guards/token.guard';
import { QueryPostOption } from 'src/tools/request.tool';
import { ResponseTool } from 'src/tools/response.tool';
import { GetUser } from '../user/decorator/getUser.decorator';
import { UserDocument } from '../user/user.entity';
import { CreateTweetDTO } from './dto/createTweet.dto';
import { TweetService } from './tweet.service';

@Controller('tweet')
@ApiTags("Tweets")
@ApiBearerAuth()
export class TweetController {
    constructor(private readonly tweetService: TweetService) { }

    @Post('/')
    @ApiOkResponse({
        type: ResponseDTO
    })
    @UseGuards(MyTokenAuthGuard)
    async createTweet(@GetUser() user: UserDocument, @Body() createTweetDto: CreateTweetDTO): Promise<ResponseDTO> {
        const newTweet = await this.tweetService.createTweet(createTweetDto, user);
        return ResponseTool.POST_OK(newTweet);
    }

    @Get('/')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getNewsFeedTweets(@GetUser() user: UserDocument, @QueryGet() query: QueryPostOption): Promise<ResponseDTO> {
        const data = await this.tweetService.getPublicOrFollowersOnlyTweets(user, query.options);
        return ResponseTool.GET_OK(data);
    }

    @Get('/:tweetId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    async getTweet(@GetUser() user: UserDocument, @Param('tweetId') tweetId: string): Promise<ResponseDTO> {
        const tweet = await this.tweetService.getTweet(tweetId, user);
        return ResponseTool.GET_OK(tweet);
    }

    @Patch('/:tweetId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    async updateTweet(@GetUser() user: UserDocument, @Param('tweetId') tweetId: string, @Body() updateTweetDto: CreateTweetDTO): Promise<ResponseDTO> {
        const updatedTweet = await this.tweetService.updateTweet(tweetId, updateTweetDto, user);
        return ResponseTool.PATCH_OK(updatedTweet);
    }

    @Delete('/:tweetId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    async deleteTweet(@GetUser() user: UserDocument, @Param('tweetId') tweetId: string): Promise<ResponseDTO> {
        await this.tweetService.deleteTweet(tweetId, user);
        return ResponseTool.DELETE_OK({ message: "Tweet deleted" });
    }
}

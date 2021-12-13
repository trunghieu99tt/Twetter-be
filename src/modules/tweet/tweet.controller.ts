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
import {
    ApiBearerAuth,
    ApiOkResponse,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
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
import { CreateTweetDTO } from './dto/createTweet.dto';
import { TweetService } from './tweet.service';

@Controller('tweet')
@ApiTags('Tweets')
@ApiBearerAuth()
export class TweetController {
    constructor(private readonly tweetService: TweetService) {}

    @Post('/')
    @ApiOkResponse({
        type: ResponseDTO,
    })
    @UseGuards(MyTokenAuthGuard)
    async createTweet(
        @GetUser() user: UserDocument,
        @Body() createTweetDto: CreateTweetDTO,
    ): Promise<ResponseDTO> {
        const newTweet = await this.tweetService.createTweet(
            createTweetDto,
            user,
        );
        return ResponseTool.POST_OK(newTweet);
    }

    @Post('/anonymous/:userId')
    async createTweetAnonymous(
        @Param('userId') userId: string,
        @Body() createTweetDto: CreateTweetDTO,
    ): Promise<ResponseDTO> {
        const newTweet = await this.tweetService.createTweetByUserId(
            userId,
            createTweetDto,
        );
        return ResponseTool.POST_OK(newTweet);
    }

    @Get('/')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getNewsFeedTweets(
        @GetUser() user: UserDocument,
        @QueryGet() query: QueryPostOption,
    ): Promise<ResponseDTO> {
        const { data, total } =
            await this.tweetService.getPublicOrFollowersOnlyTweets(
                user,
                query.options,
            );
        return ResponseTool.GET_OK(data, total);
    }

    @Get('reportedTweet')
    async getReportedTweets(): Promise<ResponseDTO> {
        const data = await this.tweetService.getReportedTweets();
        return ResponseTool.GET_OK(data);
    }

    @Get('/user/saved')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getMySavedTweets(
        @GetUser() user: UserDocument,
        @QueryGet() query: QueryPostOption,
    ): Promise<ResponseDTO> {
        const { data, total } = await this.tweetService.getSavedTweets(
            user,
            query.options,
        );
        return ResponseTool.GET_OK(data, total);
    }

    @Get('/liked/:userId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getMyLikedTweets(
        @Param('userId') userId: string,
        @QueryGet() query: QueryPostOption,
    ): Promise<ResponseDTO> {
        const { data, total } = await this.tweetService.getLikedTweets(
            userId,
            query.options,
        );
        return ResponseTool.GET_OK(data, total);
    }

    @Get('/user/:userId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getTweetsByUser(
        @GetUser() user: UserDocument,
        @Param('userId') userId: string,
        @QueryGet() query: QueryPostOption,
    ): Promise<ResponseDTO> {
        const { data, total } = await this.tweetService.getTweetsByUser(
            userId,
            query.options,
            user,
        );
        return ResponseTool.GET_OK(data, total);
    }

    @Get('/user-medias/:userId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getUserMedias(
        @GetUser() user: UserDocument,
        @Param('userId') userId: string,
        @QueryGet() query: QueryPostOption,
    ): Promise<ResponseDTO> {
        console.log('Go get user media: ', userId);
        const { data, total } = await this.tweetService.getUserMedias(
            user,
            userId,
            query.options,
        );
        return ResponseTool.GET_OK(data, total);
    }

    @Get('/popular')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getPopularTweets(
        @GetUser() user: UserDocument,
        @QueryGet() query: QueryPostOption,
    ): Promise<ResponseDTO> {
        const { data, total } = await this.tweetService.getMostPopularTweets(
            user,
            query.options,
        );
        return ResponseTool.GET_OK(data, total);
    }

    @Get('/latest')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getLatestTweets(
        @GetUser() user: UserDocument,
        @QueryGet() query: QueryPostOption,
    ): Promise<ResponseDTO> {
        const { data, total } = await this.tweetService.getLatestTweets(
            user,
            query.options,
        );
        return ResponseTool.GET_OK(data, total);
    }

    @Get('/medias')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getMedias(
        @GetUser() user: UserDocument,
        @QueryGet() query: QueryPostOption,
    ): Promise<ResponseDTO> {
        const { data, total } = await this.tweetService.getMedias(
            user,
            query.options,
        );
        return ResponseTool.GET_OK(data, total);
    }

    @Patch('/report/:tweetId')
    async reportTweet(@Param('tweetId') tweetId: string): Promise<ResponseDTO> {
        const tweet = await this.tweetService.reportTweet(tweetId);
        return ResponseTool.PATCH_OK(tweet);
    }

    @Get('/:tweetId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    async getTweet(
        @GetUser() user: UserDocument,
        @Param('tweetId') tweetId: string,
    ): Promise<ResponseDTO> {
        const tweet = await this.tweetService.getTweet(tweetId, user);
        return ResponseTool.GET_OK(tweet);
    }

    @Patch('/:tweetId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    async updateTweet(
        @GetUser() user: UserDocument,
        @Param('tweetId') tweetId: string,
        @Body() updateTweetDto: CreateTweetDTO,
    ): Promise<ResponseDTO> {
        const updatedTweet = await this.tweetService.updateTweet(
            tweetId,
            updateTweetDto,
            user,
        );
        return ResponseTool.PATCH_OK(updatedTweet);
    }

    @Delete('/:tweetId/without-permission')
    async deleteTweetWithoutPermission(
        @Param('tweetId') tweetId: string,
    ): Promise<ResponseDTO> {
        await this.tweetService.deleteTweetWithoutPermission(tweetId);
        return ResponseTool.DELETE_OK({ message: 'Tweet deleted' });
    }

    @Delete('/:tweetId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    async deleteTweet(
        @GetUser() user: UserDocument,
        @Param('tweetId') tweetId: string,
    ): Promise<ResponseDTO> {
        await this.tweetService.deleteTweet(tweetId, user);
        return ResponseTool.DELETE_OK({ message: 'Tweet deleted' });
    }

    @Post('/react/:tweetId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    async reactToTweet(
        @GetUser() user: UserDocument,
        @Param('tweetId') tweetId: string,
    ): Promise<ResponseDTO> {
        return ResponseTool.POST_OK(
            await this.tweetService.reactTweet(tweetId, user),
        );
    }

    @Post('/retweet/:tweetId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    async retweetTweet(
        @GetUser() user: UserDocument,
        @Param('tweetId') tweetId: string,
    ): Promise<ResponseDTO> {
        return ResponseTool.POST_OK(
            await this.tweetService.reTweet(tweetId, user),
        );
    }

    @Post('/save/:tweetId')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    async saveTweet(
        @GetUser() user: UserDocument,
        @Param('tweetId') tweetId: string,
    ): Promise<ResponseDTO> {
        return ResponseTool.POST_OK(
            await this.tweetService.saveTweet(tweetId, user),
        );
    }

    @Get('/hashtag/:name')
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getTweetsByHashtag(
        @GetUser() user: UserDocument,
        @Param('name') name: string,
        @QueryGet() query: QueryPostOption,
    ): Promise<ResponseDTO> {
        const { data, total } = await this.tweetService.getTweetsByHashtag(
            user,
            name,
            query.options,
        );
        return ResponseTool.GET_OK(data, total);
    }

    @Get('/count-by-hashtag/:name')
    async getCountByHashtag(@Param('name') name: string): Promise<ResponseDTO> {
        const count = await this.tweetService.countTweetByHashtag(name);
        return ResponseTool.GET_OK(count);
    }
}

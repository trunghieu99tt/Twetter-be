import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiQueryGetMany, QueryGet } from 'src/common/decorators/common.decorator';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { MyTokenAuthGuard } from 'src/common/guards/token.guard';
import { QueryPostOption } from 'src/tools/request.tool';
import { ResponseTool } from 'src/tools/response.tool';
import { GetUser } from '../user/decorator/getUser.decorator';
import { UserDocument } from '../user/user.entity';
import { CommentService } from './comment.service';
import { CreateCommentDTO } from './dto/createComment.dto';

@Controller('comment')
@ApiTags('Comments')
@ApiBearerAuth()
export class CommentController {
    constructor(private readonly commentService: CommentService) { }

    @Get('/user')
    @ApiResponse({ type: ResponseDTO })
    @ApiBearerAuth()
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getCommentsByUser(@GetUser() user: UserDocument, @QueryGet() query: QueryPostOption): Promise<ResponseDTO> {
        const comments = await this.commentService.findCommentsByUser(user, query);
        return ResponseTool.GET_OK(comments);
    }

    @Get('/:tweetId')
    @ApiOkResponse({ type: ResponseDTO })
    @UseGuards(MyTokenAuthGuard)
    @ApiQueryGetMany()
    async getCommentsByTweet(@GetUser() user: UserDocument, @Param('tweetId') tweetId: string, @QueryGet() query: QueryPostOption): Promise<ResponseDTO> {
        const comments = await this.commentService.findCommentsByTweetId(tweetId, user, query);
        const total = await this.commentService.count(query.conditions);
        return ResponseTool.GET_OK(comments, total);
    }

    @Post('/:tweetId')
    @ApiOkResponse({ type: ResponseDTO })
    @UseGuards(MyTokenAuthGuard)
    async postComment(@Param('tweetId') tweetId: string, @GetUser() user: UserDocument, @Body() commentDto: CreateCommentDTO) {
        const newComment = await this.commentService.createComment(commentDto, user, tweetId);
        return ResponseTool.POST_OK(newComment);
    }

    @Patch('/:commentId')
    @ApiOkResponse({ type: ResponseDTO })
    @UseGuards(MyTokenAuthGuard)
    async updateComment(@Param('commentId') commentId: string, @GetUser() user: UserDocument, commentDto: CreateCommentDTO) {
        const updatedComment = await this.commentService.updateComment(commentId, commentDto, user);
        return ResponseTool.PATCH_OK(updatedComment);
    }

    @Delete('/:commentId')
    @ApiOkResponse({ type: ResponseDTO })
    @UseGuards(MyTokenAuthGuard)
    async deleteComment(@Param('commentId') commentId: string, @GetUser() user: UserDocument) {
        await this.commentService.deleteComment(commentId, user);
        return ResponseTool.DELETE_OK({
            message: "OK"
        });
    }
}

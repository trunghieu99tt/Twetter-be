import { Injectable } from '@nestjs/common';
import { QueryOption, QueryPostOption } from 'src/tools/request.tool';
import { CommentService } from '../comment/comment.service';
import { HashtagService } from '../hashtag/hashtag.service';
import { TweetService } from '../tweet/tweet.service';
import { UserService } from '../user/user.service';

@Injectable()
export class SearchService {
    constructor(
        private readonly userService: UserService,
        private readonly tweetService: TweetService,
        private readonly tagService: HashtagService,
        private readonly commentService: CommentService,
    ) {}

    async search(
        searchQuery: { search: string; category: string },
        query: QueryPostOption,
    ) {
        console.log(`searchQuery`, searchQuery);
        switch (searchQuery.category) {
            case 'tweet':
                return this.tweetService.search(searchQuery.search, query);
            case 'user':
                return this.userService.search(searchQuery.search, query);
            case 'hashtag':
                return this.tagService.search(searchQuery.search, query);
            case 'comment':
                return this.commentService.search(searchQuery.search, query);
            default:
                return {
                    data: [],
                    total: 0,
                };
        }
    }
}

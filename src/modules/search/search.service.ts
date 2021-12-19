import { Injectable } from '@nestjs/common';
import { QueryOption, QueryPostOption } from 'src/tools/request.tool';
import { CommentService } from '../comment/comment.service';
import { HashtagService } from '../hashtag/hashtag.service';
import { TweetService } from '../tweet/tweet.service';
import { UserDocument } from '../user/user.entity';
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
        user: UserDocument,
        searchQuery: { search: string; category: string },
        query: QueryPostOption,
    ) {
        switch (searchQuery.category) {
            case 'tweet':
                return this.tweetService.search(
                    user,
                    searchQuery.search,
                    query,
                );
            case 'people':
                return this.userService.search(searchQuery.search, query);
            case 'hashtag':
                return this.tagService.search(searchQuery.search, query);
            case 'comment':
                return this.commentService.search(
                    user,
                    searchQuery.search,
                    query,
                );
            default:
                return {
                    data: [],
                    total: 0,
                };
        }
    }
}

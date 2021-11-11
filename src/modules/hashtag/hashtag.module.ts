import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HashtagController } from "./hashtag.controller";
import { Hashtag, HashtagSchema } from "./hashtag.entity";
import { HashtagService } from "./hashtag.service";

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Hashtag.name,
                schema: HashtagSchema
            }
        ])
    ],
    providers: [HashtagService],
    exports: [HashtagService],
    controllers: [HashtagController]
})
export class HashtagModule { }
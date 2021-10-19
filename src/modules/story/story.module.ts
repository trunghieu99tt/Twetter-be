import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { StoryController } from "./story.controller";
import { Story, StorySchema } from "./story.entity";
import { StoryService } from "./story.service";

@Module({
    imports: [MongooseModule.forFeature([
        { name: Story.name, schema: StorySchema },
    ]),],
    controllers: [StoryController],
    providers: [StoryService],
    exports: [StoryService],
})
export class StoryModule { }
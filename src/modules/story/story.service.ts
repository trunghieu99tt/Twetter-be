import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueryOption } from 'src/tools/request.tool';
import { UserDocument } from '../user/user.entity';
import { StoryDTO } from './story.dto';
import { Story, StoryDocument } from './story.entity';

@Injectable()
export class StoryService {
  constructor(
    @InjectModel(Story.name)
    private storyModel: Model<StoryDocument>,
  ) {}

  async findAll(
    option: QueryOption,
    conditions: any = {},
  ): Promise<StoryDocument[]> {
    const results = await this.storyModel
      .find(conditions)
      .sort(option.sort)
      .skip(option.skip)
      .limit(option.limit)
      .populate('owner', '_id name avatar');

    return results;
  }

  async findStory(id: string): Promise<StoryDocument> {
    return this.storyModel.findById(id);
  }

  async updateStory(id: string, user: UserDocument) {
    const story = await this.storyModel.findById(id);
    if (!story.viewerIds.some((v) => v.toString() === user._id.toString())) {
      story.viewerIds.push(user._id);
      return await story.save();
    }
  }

  async createStory(
    createStoryDto: StoryDTO,
    user: UserDocument,
  ): Promise<StoryDocument> {
    try {
      const story = new this.storyModel(createStoryDto);
      story.audience = createStoryDto.audience;
      story.owner = user;
      story.createdAt = new Date();
      const newStory = await story.save();
      console.log(`newStory`, newStory);

      return newStory;
    } catch (error) {
      console.log('error: ', error);
      throw new BadRequestException('User not found');
    }
  }

  async getStories(
    user: UserDocument,
    query: QueryOption,
  ): Promise<StoryDocument[]> {
    // get all stories where audience is 0 or 1 but user's following
    // and created at is within the last 24

    const orConditions: any[] = [
      {
        audience: 0,
      },
    ];
    if (user?.following?.length > 0) {
      orConditions.push({
        audience: 1,
        owner: {
          $in: user.following,
        },
      });
    }
    if (user) {
      orConditions.push({
        owner: user,
      });
    }

    const conditions = {
      $or: orConditions,
      createdAt: {
        $gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      },
    };

    return this.findAll(query, conditions);
  }

  async deleteStory(id: string, user: UserDocument) {
    const story = await this.storyModel.findById(id);
    if (story.owner.toString() === user._id.toString()) {
      await this.storyModel.findByIdAndDelete(id);
    } else {
      throw new BadRequestException('You are not the owner of this story');
    }
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueryOption } from 'src/tools/request.tool';
import { User, UserDocument, USER_MODEL } from './user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findAll(
    option: QueryOption,
    conditions: any = {},
  ): Promise<UserDocument[]> {
    return this.userModel
      .find(conditions)
      .sort(option.sort)
      .skip(option.skip)
      .limit(option.limit);
  }

  async findById(id: string): Promise<UserDocument> {
    return this.userModel
      .findById(id)
      .populate('followers', '_id name avatar bio followers following')
      .populate('following', '_id name avatar bio followers following')
      .exec();
  }

  async findByUserName(userName: string): Promise<UserDocument> {
    return this.userModel.findOne({ userName }).exec();
  }

  async findByUsernameOrEmail(username: string): Promise<UserDocument> {
    return this.userModel
      .findOne({
        $or: [{ username }, { email: username }],
        status: 'active',
      })
      .exec();
  }

  async findByEmail(email: string): Promise<UserDocument> {
    return this.userModel.findOne({ email }).exec();
  }

  async updateByUsername(username: string, data: any): Promise<UserDocument> {
    return this.userModel
      .findOneAndUpdate(
        {
          username,
        },
        data,
        { new: true },
      )
      .exec();
  }
}

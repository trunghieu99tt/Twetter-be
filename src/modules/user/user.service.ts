import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';

// tool
import { QueryOption } from 'src/tools/request.tool';

// entity
import { User, UserDocument } from './user.entity';

// repository
import { UserRepository } from './user.repository';

// dto
import { UpdateUserDTO } from './dto/updateUser.dto';

// constants
import { MSG } from 'src/config/constants';
import { MongoError } from 'mongodb';
import { TweetService } from '../tweet/tweet.service';


@Injectable()
export class UserService {

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private readonly userRepository: UserRepository,
    ) { }

    async validateUsernameOrEmail(username: string): Promise<boolean> {
        console.log('username: ', username);
        return (
            /^[A-Za-z0-9._-]{4,64}$/g.test(username) || // username
            /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/g.test(
                username,
            )
        ); // email
    }

    async findAll(option: QueryOption, conditions: any = {}): Promise<UserDocument[]> {
        return this.userRepository.findAll(option, conditions);
    }

    async findById(id: string): Promise<UserDocument> {
        return this.userRepository.findById(id);
    }

    async findByUsernameOrEmail(usernameOrEmail: string): Promise<UserDocument> {
        return this.userRepository.findByUsernameOrEmail(usernameOrEmail);
    }

    async createUser(user: Partial<User>): Promise<UserDocument> {

        const validateUsernameOrEmail = await this.validateUsernameOrEmail(user.username);

        if (!validateUsernameOrEmail) {
            throw new BadRequestException(UserService.name, MSG.FRONTEND.INVALID_USERNAME);
        }

        const createdUser = new this.userModel(user);

        if (!createdUser.checkPasswordConfirm()) {
            throw new BadRequestException("Password and confirm password are not equal");
        }

        try {
            await createdUser.save();
            return createdUser;
        } catch (error) {
            throw new BadRequestException(error);
        }

    }

    async updateUser(username: string, newUserInfo: UpdateUserDTO): Promise<UserDocument> {

        const user = await this.findByUsernameOrEmail(username);

        if (!user) {
            throw new BadRequestException(UserService.name, "User not found");
        }

        if (newUserInfo.password) {
            newUserInfo.password = await bcrypt.hash(newUserInfo.password, 10);
        }

        Object.assign(user, newUserInfo);

        return user
            .save()
            .then((result: UserDocument) => {
                result.password = undefined;
                return result;
            })
            .catch((err: MongoError) => {
                throw new BadRequestException(err);
            });
    }

    async findByGoogleId(id: string): Promise<UserDocument> {
        return this.userModel.findOne({
            "google.id": id
        }).exec();
    }

    async followUser(user: UserDocument, userToFollowId: string) {
        const userToFollow = await this.findById(userToFollowId);
        if (user.following.some(user => user._id.toString() === userToFollow._id.toString())) {
            user.following.splice(user.following.findIndex(user => user.id.toString() === userToFollow._id.toString()), 1);
            userToFollow.followers.splice(userToFollow.followers.findIndex(u => u._id.toString() === user._id.toString()), 1);
        } else {
            user.following.push(userToFollow);
            userToFollow.followers.push(user);
        }
        user.passwordConfirm = '';
        userToFollow.passwordConfirm = '';
        try {
            await user.save();
            await userToFollow.save();
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async getPopularUsers(user: UserDocument, option: QueryOption): Promise<UserDocument[]> {
        // return data sorted by length of followers array
        const data = await this.userModel.aggregate([
            {
                $addFields: { followers_count: { $size: { "$ifNull": ["$followers", []] } } }
            },
            {
                $sort: { "followers_count": -1 }
            },
            {
                $match: {
                    _id: { $ne: user._id },
                    followers: { $ne: user._id }
                }
            }
        ])
            .skip(option.skip)
            .limit(option.limit)
            .exec();
        await this.userModel.populate(data, { path: 'followers', select: '_id' });
        return data;
    }
}

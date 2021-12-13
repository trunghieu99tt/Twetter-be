import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
} from '@nestjs/common';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';

// tool
import { QueryOption, QueryPostOption } from 'src/tools/request.tool';

// entity
import { User, UserDocument } from './user.entity';

// repository
import { UserRepository } from './user.repository';

// dto
import { UpdateUserDTO } from './dto/updateUser.dto';

// constants
import { MSG } from 'src/common/config/constants';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { ObjectId } from 'mongodb';
import { TweetService } from '../tweet/tweet.service';
@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private readonly userRepository: UserRepository,
        @Inject(forwardRef(() => TweetService))
        private readonly tweetService: TweetService,
    ) {}

    async validateUsernameOrEmail(username: string): Promise<boolean> {
        console.log('username: ', username);
        return (
            /^[A-Za-z0-9._-]{4,64}$/g.test(username) || // username
            /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/g.test(
                username,
            )
        ); // email
    }

    async findAll(
        option: QueryOption,
        conditions: any = {},
    ): Promise<UserDocument[]> {
        return this.userRepository.findAll(option, conditions);
    }

    async findById(id: string): Promise<UserDocument> {
        return this.userRepository.findById(id);
    }

    async findByUsernameOrEmail(
        usernameOrEmail: string,
    ): Promise<UserDocument> {
        return this.userRepository.findByUsernameOrEmail(usernameOrEmail);
    }

    async generateNewPassword(password: string): Promise<string> {
        return bcrypt.hash(password, 10);
    }

    async checkIfPasswordIsCorrect(
        user: UserDocument,
        password: string,
    ): Promise<boolean> {
        return bcrypt.compare(password, user.password.toString());
    }

    deleteUnnecessaryFieldsForUpdating(user: UpdateUserDTO) {
        delete user.oldPassword;
        delete user.newPassword;
        delete user.newPasswordConfirm;
    }

    async createUser(user: Partial<User>): Promise<UserDocument> {
        const validateUsernameOrEmail = await this.validateUsernameOrEmail(
            user.username,
        );
        if (!validateUsernameOrEmail) {
            throw new BadRequestException(
                UserService.name,
                MSG.FRONTEND.INVALID_USERNAME,
            );
        }
        const createdUser = new this.userModel(user);

        console.log('createdUser: ', createdUser);

        if (!createdUser.checkPasswordConfirm()) {
            throw new BadRequestException(
                'Password and confirm password are not equal',
            );
        }
        try {
            await createdUser.save();
            return createdUser;
        } catch (error) {
            console.log('error: ', error);
            throw new BadRequestException(error);
        }
    }

    async checkIfEmailAlreadyTakenByOtherUser(
        email: string,
        userId: string,
    ): Promise<boolean> {
        const user = await this.userModel.findOne({
            email,
        });

        return user && user?._id && user._id.toString() != userId;
    }

    async checkIfEmailIsAvailable(
        email: string,
        userId: string,
    ): Promise<void> {
        if (!this.validateUsernameOrEmail(email)) {
            throw new BadRequestException(UserService.name, 'Invalid email');
        }
        const isEmailAlreadyTakenByOtherUser =
            await this.checkIfEmailAlreadyTakenByOtherUser(email, userId);

        if (isEmailAlreadyTakenByOtherUser) {
            throw new BadRequestException(
                UserService.name,
                'Email is already taken',
            );
        }
    }

    async preUpdateUserHook(userId: string, newUserInfo: UpdateUserDTO) {
        const user = await this.findById(userId);

        if (!user) {
            throw new BadRequestException(UserService.name, 'User not found');
        }

        if (newUserInfo.email) {
            await this.checkIfEmailIsAvailable(newUserInfo.email, userId);
        }

        if (newUserInfo.password) {
            newUserInfo.password = await this.generateNewPassword(
                newUserInfo.password,
            );
        }

        if (newUserInfo.oldPassword) {
            const isPasswordCorrect = await this.checkIfPasswordIsCorrect(
                user,
                newUserInfo.oldPassword,
            );
            if (!isPasswordCorrect) {
                throw new BadRequestException(
                    UserService.name,
                    'Old password is not valid',
                );
            }
            newUserInfo.password = await this.generateNewPassword(
                newUserInfo.newPassword,
            );
            this.deleteUnnecessaryFieldsForUpdating(newUserInfo);
        }

        return newUserInfo;
    }

    async updateUser(
        userId: string,
        data: UpdateUserDTO,
    ): Promise<UserDocument> {
        const newUserInfo = await this.preUpdateUserHook(userId, data);

        try {
            const response = await this.userModel.findOneAndUpdate(
                {
                    _id: userId,
                },
                newUserInfo,
                {
                    new: true,
                },
            );

            return response;
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async updateUserById(
        userId: string,
        data: UpdateUserDTO,
        requestUser: UserDocument,
    ): Promise<UserDocument> {
        if (['admin', 'root-admin'].includes(requestUser.role)) {
            throw new BadRequestException(
                UserService.name,
                'You are not admin',
            );
        }

        return this.updateUser(userId, data);
    }

    async findByGoogleId(id: string): Promise<UserDocument> {
        return this.userModel
            .findOne({
                'google.id': id,
            })
            .exec();
    }

    async followUser(user: UserDocument, userToFollowId: string) {
        if (user._id.toString() === userToFollowId) {
            throw new BadRequestException(
                UserService.name,
                "You can't follow yourself",
            );
        }

        const userToFollow = await this.findById(userToFollowId);

        if (
            user.following.some(
                (user) => user._id.toString() === userToFollow._id.toString(),
            )
        ) {
            user.following.splice(
                user.following.findIndex(
                    (user) =>
                        user.id.toString() === userToFollow._id.toString(),
                ),
                1,
            );
            userToFollow.followers.splice(
                userToFollow.followers.findIndex(
                    (u) => u._id.toString() === user._id.toString(),
                ),
                1,
            );
        } else {
            user.following.push(userToFollow);
            userToFollow.followers.push(user);
        }
        user.passwordConfirm = '';
        userToFollow.passwordConfirm = '';

        try {
            await this.userModel.findByIdAndUpdate(user._id, {
                following: user.following,
            });

            await this.userModel.findByIdAndUpdate(userToFollow._id, {
                followers: userToFollow.followers,
            });
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async getPopularUsers(
        user: UserDocument,
        option: QueryOption,
    ): Promise<{
        data: UserDocument[];
        total: number;
    }> {
        // return data sorted by length of followers array
        const data = await this.userModel
            .aggregate([
                {
                    $addFields: {
                        followers_count: {
                            $size: { $ifNull: ['$followers', []] },
                        },
                    },
                },
                {
                    $sort: { followers_count: -1 },
                },
                {
                    $match: {
                        _id: { $ne: user._id },
                        followers: { $ne: user._id },
                    },
                },
            ])
            .skip(option.skip)
            .limit(option.limit)
            .exec();

        await this.userModel.populate(data, {
            path: 'followers',
            select: '_id',
        });

        const conditions = {
            _id: { $ne: user._id },
            followers: { $ne: user._id },
        };
        const count = await this.userModel.countDocuments(conditions);

        return {
            data,
            total: count,
        };
    }

    count({ conditions }: { conditions?: any } = {}): Promise<number> {
        return Object.keys(conditions || {}).length > 0
            ? this.userModel.countDocuments(conditions).exec()
            : this.userModel.estimatedDocumentCount().exec();
    }

    async findAllAndCount(
        option: QueryOption,
        conditions: any = {},
    ): Promise<ResponseDTO> {
        const data = await this.findAll(option, conditions);
        const total = await this.count({ conditions });
        return { data, total };
    }

    async search(search: string, query: QueryPostOption) {
        const conditions = {
            $or: [
                {
                    name: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    email: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    userName: {
                        $regex: search,
                        $options: 'i',
                    },
                },
                {
                    id: search,
                },
                {
                    status: {
                        $regex: search,
                        $options: 'i',
                    },
                },
            ],
        };

        return this.findAllAndCount(query.options, conditions);
    }

    async getUserList(query: QueryPostOption) {
        const conditions = {
            $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
        };

        return this.findAllAndCount(query.options, conditions);
    }

    async deleteUser(userId: string) {
        try {
            return this.userModel.findByIdAndDelete(userId);
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async followAnonymous({ userAId, userBId }) {
        // add userB to following list of userA
        const userA = await this.findById(userAId);
        if (!userA.following.some((user) => user._id.toString() === userBId)) {
            const userB = await this.findById(userBId);
            userA.following.push(userB);
            userB.followers.push(userA);
            await this.userModel.findByIdAndUpdate(userA._id, {
                following: userA.following,
            });
            await this.userModel.findByIdAndUpdate(userB._id, {
                followers: userB.followers,
            });
        }
    }

    async getMostActiveUsers() {
        const users = await this.userModel.find({
            status: 'active',
        });

        const usersTweetCounter = await Promise.all(
            users.map(async (user: UserDocument) => {
                const userTweet = await this.tweetService.countTweetByUser(
                    user._id,
                );
                return {
                    user,
                    tweetCount: userTweet,
                };
            }),
        );

        const response = usersTweetCounter
            .sort((a, b) => b.tweetCount - a.tweetCount)
            .slice(0, 5);

        return response;
    }
}

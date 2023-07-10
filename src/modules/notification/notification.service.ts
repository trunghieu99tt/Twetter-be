import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { QueryOption, QueryPostOption } from 'src/tools/request.tool';
import { UserDocument } from '../user/user.entity';
import { Notification, NotificationDocument } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async findAll(
    option: QueryOption,
    conditions: any = {},
  ): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find(conditions)
      .sort(option.sort)
      .skip(option.skip)
      .limit(option.limit)
      .populate('sender', '_id name avatar');
  }

  count({ conditions }: { conditions?: any } = {}): Promise<number> {
    return Object.keys(conditions || {}).length > 0
      ? this.notificationModel.countDocuments(conditions).exec()
      : this.notificationModel.estimatedDocumentCount().exec();
  }

  async findAllAndCount(
    option: QueryOption,
    conditions: any = {},
  ): Promise<ResponseDTO> {
    const data = await this.findAll(option, conditions);
    const total = await this.count({ conditions });
    return { data, total };
  }

  async createNotification(user: UserDocument, notificationDto: Notification) {
    const newNotification = new this.notificationModel(notificationDto);
    newNotification.sender = user;
    newNotification.createdAt = new Date();
    newNotification.isRead = [];
    return newNotification.save();
  }

  async deleteNotification(notificationId: string) {
    return this.notificationModel.findByIdAndDelete(notificationId);
  }

  async getNotifications(userId: string, query: QueryPostOption) {
    const conditions = {
      receivers: `${userId}`,
    };
    query.options.sort = { createdAt: -1 };
    const response = await this.findAllAndCount(query.options, conditions);
    return response;
  }

  async updateReadStatusNotification(userId: string, notificationId: string) {
    const notification = await this.notificationModel.findById(notificationId);
    if (notification) {
      if (!notification.isRead.includes(userId)) {
        notification.isRead.push(userId);
        return notification.save();
      }
    }
  }

  async updateReadStatusNotifications(
    userId: string,
    ids: string[],
  ): Promise<void> {
    const notifications = await this.notificationModel.find({
      _id: { $in: ids },
    });

    if (notifications) {
      notifications.forEach((notification) => {
        if (!notification.isRead.includes(userId)) {
          notification.isRead.push(userId);
        }
      });

      console.log('notifications', notifications);

      const response = await this.notificationModel.bulkWrite(
        notifications.map((notification) => ({
          updateOne: {
            filter: { _id: notification._id },
            update: { $set: { isRead: notification.isRead } },
          },
        })),
      );
      console.log('response', response);
    }
  }

  async deleteAllNotifications(userId: string) {
    const conditions = {
      ' user._id': userId,
    };
    return this.notificationModel.deleteMany(conditions);
  }
}

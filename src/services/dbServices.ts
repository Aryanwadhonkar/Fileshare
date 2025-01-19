import mongoose from 'mongoose';
import { config } from '../config';
import { UserModel } from '../models/userModel';
import { MediaModel } from '../models/mediaModel';

export class DatabaseService {
  static async connect(): Promise<void> {
    try {
      await mongoose.connect(config.MONGODB_URI);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  }

  static async createUser(telegramId: number, username: string): Promise<void> {
    const user = new UserModel({
      telegramId,
      username,
      isAdmin: config.ADMIN_IDS.includes(telegramId)
    });
    await user.save();
  }

  static async toggleSubscription(telegramId: number): Promise<boolean> {
    const user = await UserModel.findOne({ telegramId });
    if (user) {
      user.isSubscribed = !user.isSubscribed;
      await user.save();
      return user.isSubscribed;
    }
    return false;
  }

  static async banUser(telegramId: number): Promise<boolean> {
    const user = await UserModel.findOne({ telegramId });
    if (user) {
      user.isBanned = true;
      await user.save();
      return true;
    }
    return false;
  }

  static async unbanUser(telegramId: number): Promise<boolean> {
    const user = await UserModel.findOne({ telegramId });
    if (user) {
      user.isBanned = false;
      await user.save();
      return true;
    }
    return false;
  }

  static async getSubscribers(): Promise<number[]> {
    const users = await UserModel.find({ isSubscribed: true, isBanned: false });
    return users.map(user => user.telegramId);
  }

  static async recordMedia(fileId: string, type: string, sharedBy: number): Promise<void> {
    const media = new MediaModel({ fileId, type, sharedBy });
    await media.save();

    await UserModel.updateOne(
      { telegramId: sharedBy },
      { $inc: { [`sharedMedia.${type}s`]: 1 } }
    );
  }

  static async getStats(): Promise<any> {
    const subscriberCount = await UserModel.countDocuments({ isSubscribed: true });
    const mediaCount = await MediaModel.countDocuments();
    const mediaByType = await MediaModel.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    return {
      subscribers: subscriberCount,
      totalMedia: mediaCount,
      mediaByType: mediaByType.reduce((acc, curr) => ({
        ...acc,
        [curr._id]: curr.count
      }), {})
    };
  }
}

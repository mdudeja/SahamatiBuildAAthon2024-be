import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findOne(
    username: string,
    userType: User['userType'],
  ): Promise<UserDocument | undefined> {
    return this.userModel
      .findOne({
        username,
        userType,
      })
      .exec();
  }

  async create(user: User): Promise<UserDocument> {
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async update(username: string, user: User): Promise<UserDocument> {
    return this.userModel
      .findOneAndUpdate({ username }, user, { new: true })
      .exec();
  }
}

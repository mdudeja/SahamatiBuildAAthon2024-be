import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EndUser, EndUserDocument } from './end-user.schema';
import { Model } from 'mongoose';

@Injectable()
export class EndUserService {
  constructor(
    @InjectModel(EndUser.name) private readonly endUserModel: Model<EndUser>,
  ) {}

  async findOne(
    phone: string,
    pan: string,
  ): Promise<EndUserDocument | undefined> {
    return this.endUserModel
      .findOne({
        phone,
        pan,
      })
      .exec();
  }
}

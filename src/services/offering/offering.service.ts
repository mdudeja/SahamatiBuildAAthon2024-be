import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Offering } from './offering.schema';

@Injectable()
export class OfferingService {
  constructor(
    @InjectModel(Offering.name) private readonly offeringModel: Model<Offering>,
  ) {}

  async create(offering: Offering): Promise<Offering> {
    const createdOffering = new this.offeringModel(offering);
    return createdOffering.save();
  }

  async getAllByType(type: string): Promise<Offering[]> {
    return this.offeringModel.find({ offering_type: type }).exec();
  }
}

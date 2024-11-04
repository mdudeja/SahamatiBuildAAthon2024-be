import { Injectable } from '@nestjs/common';
import { Offering } from 'src/services/offering/offering.schema';
import { OfferingService } from 'src/services/offering/offering.service';

@Injectable()
export class FiuofferingsService {
  constructor(private readonly offeringService: OfferingService) {}

  async createOffering(offering: Offering): Promise<any> {
    return this.offeringService.create(offering);
  }

  async getOfferingsByType(type: string): Promise<any> {
    return this.offeringService.getAllByType(type);
  }

  async getAllOfferings(): Promise<any> {
    return this.offeringService.getAll();
  }
}

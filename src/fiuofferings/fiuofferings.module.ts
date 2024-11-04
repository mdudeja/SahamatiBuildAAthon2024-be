import { Module } from '@nestjs/common';
import { FiuofferingsService } from './fiuofferings.service';
import { FiuofferingsController } from './fiuofferings.controller';
import { OfferingService } from 'src/services/offering/offering.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Offering,
  OfferingSchema,
} from 'src/services/offering/offering.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Offering.name,
        schema: OfferingSchema,
      },
    ]),
  ],
  controllers: [FiuofferingsController],
  providers: [FiuofferingsService, OfferingService],
})
export class FiuofferingsModule {}

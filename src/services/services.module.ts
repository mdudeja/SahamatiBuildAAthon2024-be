import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user/user.schema';
import { UserService } from './user/user.service';
import { OfferingService } from './offering/offering.service';
import { Offering, OfferingSchema } from './offering/offering.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Offering.name,
        schema: OfferingSchema,
      },
    ]),
  ],
  providers: [UserService, OfferingService],
  exports: [UserService, OfferingService],
})
export class ServicesModule {}

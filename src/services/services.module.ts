import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user/user.schema';
import { UserService } from './user/user.service';
import { OfferingService } from './offering/offering.service';
import { Offering, OfferingSchema } from './offering/offering.schema';
import { GeminiService } from './gemini/gemini.service';
import { OpenaiService } from './openai/openai.service';
import { PrompterService } from './prompter/prompter.service';
import { RedisService } from './redis/redis.service';

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
  providers: [
    UserService,
    OfferingService,
    GeminiService,
    OpenaiService,
    PrompterService,
    RedisService,
  ],
  exports: [
    UserService,
    OfferingService,
    GeminiService,
    OpenaiService,
    PrompterService,
    RedisService,
  ],
})
export class ServicesModule {}

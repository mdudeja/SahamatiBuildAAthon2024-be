import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrompterService } from 'src/services/prompter/prompter.service';
import { OpenaiService } from 'src/services/openai/openai.service';
import { GeminiService } from 'src/services/gemini/gemini.service';
import { RedisService } from 'src/services/redis/redis.service';
import { FiuofferingsService } from 'src/fiuofferings/fiuofferings.service';
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
  providers: [
    ChatGateway,
    ChatService,
    PrompterService,
    OpenaiService,
    GeminiService,
    RedisService,
    FiuofferingsService,
    OfferingService,
  ],
  exports: [ChatService],
})
export class ChatModule {}

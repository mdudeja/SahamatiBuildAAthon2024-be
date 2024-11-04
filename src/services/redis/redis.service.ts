import { Injectable } from '@nestjs/common';
import {
  createClient,
  RedisClientType,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from 'redis';
import { AssistantMessage, UserMessage } from '../prompter/prompter.service';

@Injectable()
export class RedisService {
  client: RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

  async connect() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    }).on('error', (err) => {
      console.error(err);
    });

    await this.client.connect();
  }

  async setJSONArray(
    key: string,
    value: Array<UserMessage | AssistantMessage>,
  ) {
    if (!this.client) {
      await this.connect();
    }

    await this.client.set(key, JSON.stringify(value));
  }

  async getJSONArray(
    key: string,
  ): Promise<Array<UserMessage | AssistantMessage>> {
    if (!this.client) {
      await this.connect();
    }

    const value = (await this.client.get(key)) ?? '[]';

    return JSON.parse(value);
  }
}

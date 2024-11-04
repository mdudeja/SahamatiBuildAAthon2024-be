import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { FiuofferingsService } from 'src/fiuofferings/fiuofferings.service';
import { OpenaiService } from 'src/services/openai/openai.service';
import {
  AssistantMessage,
  PrompterService,
  UserMessage,
} from 'src/services/prompter/prompter.service';
import { RedisService } from 'src/services/redis/redis.service';

export type RAGContext = {
  id: number;
  entity: {
    type: 'instrument_info' | 'user_bank_statement';
    value: any;
  };
};

export type RAGResponse = {
  query: string;
  client_id: string;
  session_id: string;
  context: RAGContext[][];
};

@Injectable()
export class ChatService {
  connected_clients: Map<
    string,
    {
      session_id: string;
      client: Socket;
    }
  > = new Map();

  constructor(
    private readonly prompterService: PrompterService,
    private readonly openAiService: OpenaiService,
    private readonly redisService: RedisService,
    private readonly fiuOfferingService: FiuofferingsService,
  ) {}

  async answerText(data: string, client_id: string) {
    const session_id =
      this.connected_clients.get(client_id)?.session_id ?? client_id;
    const existingHistory = await this.redisService.getJSONArray(session_id);
    let searchIntent: string;

    if (existingHistory.length > 0) {
      searchIntent = await this.fetchSearchIntent({
        query: data,
        history: existingHistory,
      });
    }

    const rag_context = (await this.fiuOfferingService.getAllOfferings()).map(
      (offering) => offering.toJSON(),
    );

    try {
      const json: RAGResponse = {
        query: searchIntent ?? data,
        client_id,
        session_id,
        context: [rag_context],
      };

      const { question, questionTokens, payload } =
        await this.prompterService.generatePromptForOpenAI({
          ...json,
          query: data,
        });

      const answer = await this.openAiService.answer(payload);

      this.addInteractionToRedis({
        session_id: json.session_id,
        messages: [
          {
            message: {
              role: 'user',
              content: question,
            },
            promptTokens: questionTokens,
          },
          {
            message: {
              role: 'assistant',
              content: answer.answer,
            },
            promptTokens: answer.completion_tokens,
          },
        ],
      });

      return answer.answer;
    } catch (e) {
      console.error(e);
      return;
    }
  }

  addClient(client: Socket) {
    const session_id = client.handshake.query.session_id;

    this.connected_clients.set(client.id, {
      session_id: session_id as string,
      client,
    });
  }

  removeClient(client: Socket) {
    this.connected_clients.delete(client.id);
  }

  async addInteractionToRedis({
    messages,
    session_id,
  }: {
    messages: Array<UserMessage | AssistantMessage>;
    session_id: string;
  }) {
    const existing = await this.redisService.getJSONArray(session_id);
    existing.push(...messages);

    await this.redisService.setJSONArray(session_id, existing);
  }

  async fetchSearchIntent({
    query,
    history,
  }: {
    query: string;
    history: Array<UserMessage | AssistantMessage>;
  }) {
    const intent = await this.openAiService.fetchSearchIntent({
      query,
      history,
    });

    return intent;
  }

  prepareTTSText(text: string) {
    const regexForLinksInMarkdown = /\[.*\]\(.*\)/g;
    const allLinks = text.match(regexForLinksInMarkdown);

    const separatedLinks: { url: string; title: string }[] = [];

    if (allLinks) {
      allLinks.forEach((link, idx) => {
        const title = link.match(/\[.*\]/g)[0];
        const url = link.match(/\(.*\)/g)[0];

        separatedLinks.push({ url, title });
        text = text.replace(
          `Source:\n${link}`,
          `For more information, please check Link ${idx + 1} in the next message`,
        );
      });
    }

    return { text, links: separatedLinks };
  }

  async generateTTS(client_id: string, text: string) {
    const session_id = this.connected_clients.get(client_id).session_id;
    return this.openAiService.generateTTS(session_id, text);
  }
}

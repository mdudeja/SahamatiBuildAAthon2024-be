import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import { RAGContext, RAGResponse } from 'src/chat/chat.service';
import { RedisService } from '../redis/redis.service';
import { isEmpty } from 'lodash';
import OpenAI from 'openai';
import { EndUser } from '../end-user/end-user.schema';

export type UserMessage = {
  message: {
    role: 'user';
    content: string;
  };
  promptTokens: number;
};

export type SystemMessage = {
  message: {
    role: 'system';
    content: string;
  };
  promptTokens: number;
};

export type AssistantMessage = {
  message: {
    role: 'assistant';
    content: string;
  };
  promptTokens: number;
};

@Injectable()
export class PrompterService {
  systemMessage: SystemMessage;
  systemMessageTokens: number;
  openaiCounter: OpenAI;

  constructor(private readonly redisService: RedisService) {
    this.openaiCounter = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generatePromptForOpenAI(context: RAGResponse, endUserDetails: EndUser) {
    if (!this.systemMessage) {
      this.systemMessage = await this.getSystemPrompt();
    }

    const question = this.formatQuestion(context.query);
    const messageHistory = await this.redisService.getJSONArray(
      context.session_id,
    );
    const searchResults = this.getFormattedSearchResults(context.context?.[0]);

    const userMessage = await this.getFormattedUserMessage({
      question,
      searchResults,
      max_tokens: 4000,
      endUserDetails,
    });

    const messagePayload = await this.createPromptPayload({
      userMessage,
      messageHistory,
      max_tokens: Math.min(3000, userMessage.promptTokens) + 5000,
    });

    return {
      question: userMessage.message.content,
      questionTokens: userMessage.promptTokens,
      payload: messagePayload,
    };
  }

  cleanAndTrim(text: string) {
    return text
      .replace('\n+', '\n')
      .replace('\t+', '\t')
      .replace(' +', ' ')
      .trim();
  }

  formatQuestion(question: string) {
    const trimmed = this.cleanAndTrim(question);

    if (!trimmed.endsWith('?')) {
      return trimmed + '?';
    }

    return trimmed;
  }

  async getSystemPrompt(): Promise<SystemMessage> {
    const filepath = process.env.SYSTEM_PROMPT_FILE;
    const sp = fs.readFileSync(filepath, 'utf-8').toString();
    const message: SystemMessage['message'] = { role: 'system', content: sp };
    const tokens = await this.getTokens([message]);

    return { message, promptTokens: tokens };
  }

  getFormattedSearchResults(documents: RAGContext[]) {
    const formatted: Map<string, string[]> = new Map();

    const reversed = documents.slice().reverse();

    reversed.forEach((doc) => {
      if (!formatted.has((doc as any).offering_type)) {
        formatted.set((doc as any).offering_type, []);
      }

      formatted.get((doc as any).offering_type)?.push((doc as any).details);
    });

    const formattedMap = new Map<string, string[]>();
    formatted.forEach((value, key) => {
      formattedMap.set(
        key,
        value.map((v) => {
          return Object.entries(v)
            .map((e) => e.join(':'))
            .join(',');
        }),
      );
    });

    return formattedMap;
  }

  async getFormattedUserMessage({
    question,
    searchResults,
    max_tokens = 4000,
    endUserDetails,
  }: {
    question: string;
    searchResults: Map<string, string[]>;
    max_tokens: number;
    endUserDetails?: EndUser;
  }): Promise<UserMessage> {
    if (isEmpty(searchResults)) {
      return {
        message: {
          role: 'user',
          content: `Question: ${question}`,
        },
        promptTokens: 0,
      };
    }

    let total_tokens = 0;

    const formatted = await Array.from(searchResults).reduce(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (acc, [org, docs]) => {
        const docs_text = (
          await Promise.all(
            docs.map(async (doc) => {
              const doc_text = doc;
              const tokens = await this.getTokens([
                {
                  role: 'system',
                  content: doc_text,
                },
              ]);

              if (total_tokens + tokens > max_tokens) {
                return '';
              }

              total_tokens += tokens;

              return doc_text;
            }),
          )
        ).join('');

        return `${await acc}${docs_text}\n\n`;
      },
      Promise.resolve(''),
    );
    let formattedEndUserDetails = '';

    if (endUserDetails) {
      const endUserDetailsText = `Name: ${endUserDetails.name}\nPhone Number: ${endUserDetails.phone}\nPAN Number: ${endUserDetails.pan}\nAverage Monthly Balance: ${endUserDetails.amb}\n\n`;
      const tokens = await this.getTokens([
        {
          role: 'system',
          content: endUserDetailsText,
        },
      ]);

      if (total_tokens + tokens <= max_tokens) {
        formattedEndUserDetails += endUserDetailsText;
        total_tokens += tokens;
      }
    }

    return {
      message: {
        role: 'user',
        content: `Question: ${question}\n\nDocuments:\n\nCustomerDetails:\n\n${formattedEndUserDetails}\n\nProduct Offerings:\n\n${formatted}Answer: `,
      },
      promptTokens: total_tokens,
    };
  }

  async getTokens(
    messages: Array<SystemMessage['message'] | UserMessage['message']>,
  ) {
    let totalTokens = 0;

    for (const message of messages) {
      const response = await this.openaiCounter.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [message],
        max_tokens: 1,
      });

      totalTokens += response.usage.total_tokens;
    }

    return totalTokens;
  }

  async createPromptPayload({
    userMessage,
    messageHistory,
    max_tokens,
    for_search_intent = false,
  }: {
    userMessage: UserMessage;
    messageHistory: Array<UserMessage | AssistantMessage>;
    max_tokens: number;
    for_search_intent?: boolean;
  }) {
    const usableHistory = [];
    if (!for_search_intent) {
      max_tokens -= this.systemMessage?.promptTokens ?? 0;
    }

    if (userMessage.message.content && userMessage.message.content.length > 0) {
      messageHistory.push(userMessage);
    }

    messageHistory
      .slice()
      .reverse()
      .forEach((message) => {
        const mTokens = +message.promptTokens;

        if (mTokens < max_tokens) {
          const isUserMessage = message.message.role === 'user';
          usableHistory.unshift(
            for_search_intent && isUserMessage
              ? {
                  role: 'user',
                  content: message.message.content.split('\n')[0],
                }
              : message.message,
          );
          max_tokens -= mTokens;
        }
      });

    if (!for_search_intent) {
      usableHistory.unshift({
        role: 'system',
        content: this.systemMessage?.message?.content,
      });
    }
    return usableHistory;
  }
}

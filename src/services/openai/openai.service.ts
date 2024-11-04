import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
  UserMessage,
  SystemMessage,
  AssistantMessage,
  PrompterService,
} from '../prompter/prompter.service';
import * as fs from 'fs';

@Injectable()
export class OpenaiService {
  openai: OpenAI;

  constructor(private readonly prompterService: PrompterService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async answer(
    messages: Array<
      | UserMessage['message']
      | SystemMessage['message']
      | AssistantMessage['message']
    >,
  ) {
    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_NAME,
      messages,
      temperature: 0.7,
      max_completion_tokens: 4096,
      frequency_penalty: 0.5,
    });

    return {
      answer: completion.choices[0].message.content,
      completion_tokens: completion.usage.completion_tokens,
    };
  }

  async fetchSearchIntent({
    query,
    history,
  }: {
    query: string;
    history: Array<UserMessage | AssistantMessage>;
  }) {
    const searchPrompt = await this.prompterService.createPromptPayload({
      userMessage: {
        message: {
          role: 'user',
          content: query,
        },
        promptTokens: 0,
      },
      messageHistory: history,
      max_tokens: 1024,
      for_search_intent: true,
    });

    searchPrompt.unshift({
      role: 'system',
      content:
        "You are a helpful chatbot. Generate a precise english query (typically 5-10 words long) generated from the user's previous interactions with the chatbot and/or the available documents.",
    });

    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_NAME,
      messages: searchPrompt,
      temperature: 0.7,
      max_completion_tokens: 4096,
      frequency_penalty: 0.5,
    });

    return completion.choices[0].message.content;
  }

  async generateTTS(session_id: string, text: string) {
    const speechFile = `${process.env.TTS_FILES}/${session_id}.mp3`;

    const mp3 = await this.openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: text.split('\n')[0],
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Save the file to the filesystem
    fs.writeFileSync(speechFile, buffer);

    return `${session_id}.mp3`;
  }
}

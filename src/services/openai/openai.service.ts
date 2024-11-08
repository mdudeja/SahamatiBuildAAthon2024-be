import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
  UserMessage,
  SystemMessage,
  AssistantMessage,
  PrompterService,
} from '../prompter/prompter.service';
import * as fs from 'fs';
import { EndUserService } from '../end-user/end-user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenaiService {
  openai: OpenAI;

  constructor(
    private readonly prompterService: PrompterService,
    private readonly enduserService: EndUserService,
    private readonly configService: ConfigService,
  ) {
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

    const processedAnswer = await this.processAnswer(
      completion.choices[0].message.content,
    );

    return {
      answer: processedAnswer[0],
      completion_tokens: completion.usage.completion_tokens,
      endUserDetails: processedAnswer[1],
    };
  }

  async processAnswer(answer: string) {
    const sansBackticks = answer.replace(/`/g, '').trim();
    const sansJsonText = sansBackticks.replace(/json/g, '').trim();
    const sansLineBreaks = sansJsonText.replace(/\n/g, ' ').trim();

    let endUserDetails = null;
    let textMessage = null;

    try {
      const parsed = JSON.parse(sansLineBreaks);
      if (parsed.phone_number) {
        const endUser = await this.enduserService.findOne(
          parsed.phone_number.toString(),
          parsed.pan_number.toString(),
        );

        if (!endUser) {
          textMessage =
            'Oops! I could not find any details for the given phone number and PAN number. Please try again';
        } else {
          textMessage = `Hi ${endUser.name}, please provide the OTP sent to your registered mobile number`;
          endUserDetails = endUser;
        }
      }

      if (parsed.otp) {
        if (parsed.otp.toString() === this.configService.get('default.otp')) {
          textMessage =
            'Thank you! Your OTP has been verified successfully. What would you like to know?';
        } else {
          textMessage =
            'Oops! The OTP you provided is incorrect. Please try again';
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      textMessage = sansJsonText;
    }

    return [textMessage, endUserDetails];
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

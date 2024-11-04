import {
  GenerativeModel,
  GoogleGenerativeAI,
  SchemaType,
} from '@google/generative-ai';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GeminiService {
  genAI: GoogleGenerativeAI;
  modelTranslation: GenerativeModel;
  modelTranscription: GenerativeModel;
  modelTranscriptionFixer: GenerativeModel;
  modelLangDetection: GenerativeModel;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    this.modelTranslation = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.5,
      },
      systemInstruction:
        "You are a translator. You translate the provided text into the target language. Please ouput only the translated text and nothing else. If the input text is markdown, please ensure that the output text is also markdown. If the input markdown has URLs, please don't translate the links or the text inside [] right before the URL.",
    });

    const transcriptionSchema = {
      description: 'Transcribed and translated text from an audio file.',
      type: SchemaType.OBJECT,
      properties: {
        lang_code: {
          type: SchemaType.STRING,
          description:
            'ISO 639-1 code of the language of the original audio file.',
          nullable: false,
        },
        lang_name: {
          type: SchemaType.STRING,
          description:
            'English name of the language of the original audio file.',
          nullable: false,
        },
        transcribed_text: {
          type: SchemaType.STRING,
          description: 'Transcribed text from the audio file.',
          nullable: false,
        },
        translated_text: {
          type: SchemaType.STRING,
          description: 'transcribed_text translated to English.',
          nullable: true,
        },
      },
    };

    this.modelTranscription = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.5,
        responseMimeType: 'application/json',
        responseSchema: transcriptionSchema,
      },
      systemInstruction:
        'You are a transcription expert. You are given an audio file and you follow these steps to generate the output: 1. Transcribe the audio file. 2. Identify the language of the audio file. Please be mindful that people speak English with a lot of different accents. 3. If the lang_code of spoken language is not en, translate the transcription to English. Please provide the output in the format specified in the response schema.',
    });

    this.modelTranscriptionFixer = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.5,
      },
      systemInstruction:
        'You are a language expert. You are given text that has been translated from a different language to English. You should output the corrected text in English. Please provide only the corrected text and nothing else.',
    });

    const langDetectionSchema = {
      description: 'Detected language of the input text.',
      type: SchemaType.OBJECT,
      properties: {
        lang_code: {
          type: SchemaType.STRING,
          description: 'ISO 639-1 code of the detected language.',
          nullable: false,
        },
        lang_name: {
          type: SchemaType.STRING,
          description: 'English name of the detected language.',
          nullable: false,
        },
      },
    };

    this.modelLangDetection = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.5,
        responseMimeType: 'application/json',
        responseSchema: langDetectionSchema,
      },
    });
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    const prompt = `Translate the following text into ${targetLanguage}: ${text}`;

    const response = await this.modelTranslation.generateContent(prompt);

    return response.response.text().trim();
  }

  async transcribeAudio(
    base64Audio: string,
    use_ogg?: boolean,
  ): Promise<{
    source_lang_name: string;
    source_lang_code: string;
    text: string;
  }> {
    const result = await this.modelTranscription.generateContent([
      {
        inlineData: {
          mimeType: use_ogg ? 'audio/ogg' : 'audio/webm',
          data: base64Audio,
        },
      },
      {
        text: 'Generate a transcription of the speech and translate it to English.',
      },
    ]);

    const first_round = JSON.parse(result.response.text().trim());

    if (first_round.lang_code && first_round.lang_code != 'en') {
      const second_round = await this.modelTranscriptionFixer.generateContent(
        first_round.translated_text,
      );

      return {
        source_lang_name: first_round.lang_name,
        source_lang_code: first_round.lang_code,
        text: second_round.response.text().trim(),
      };
    }

    return {
      source_lang_name: first_round.lang_name,
      source_lang_code: first_round.lang_code,
      text: first_round.transcribed_text,
    };
  }

  async detectLanguage(text: string): Promise<string> {
    const prompt = `Detect the language of the following text: ${text}`;

    const response = await this.modelLangDetection.generateContent(prompt);

    return response.response.text().trim();
  }
}

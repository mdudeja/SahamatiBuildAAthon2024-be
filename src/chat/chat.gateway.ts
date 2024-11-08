import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { GeminiService } from 'src/services/gemini/gemini.service';
import { EndUser } from 'src/services/end-user/end-user.schema';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
  serveClient: false,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly geminiService: GeminiService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Socket Client connected: ${client.id}`);

    this.chatService.addClient(client);

    client.emit('message', {
      event: 'connection',
      content: {
        id: client.id,
      },
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket Client disconnected: ${client.id}`);
    this.chatService.removeClient(client);

    client.disconnect();
  }

  @SubscribeMessage('client-message')
  async onMessage(
    @MessageBody()
    data: {
      event:
        | 'question-text'
        | 'question-voice'
        | 'translate'
        | 'get-language'
        | 'tts';
      content: any;
      needsTTS?: boolean;
      endUserDetails?: EndUser;
    },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    console.log(`Socket Client message: ${client.id}`);
    console.log(JSON.stringify(data, null, 2));
    switch (data.event) {
      case 'question-text':
        client.emit('message', {
          event: 'articulating',
          content: 'Articulating...',
        });

        const answer = await this.chatService.answerText(
          data.content,
          client.id,
          data.endUserDetails,
        );

        client.emit('message', {
          event: 'articulating',
          content: '',
          clearTrigger: true,
        });

        client.emit('message', {
          event: 'answer-text',
          content: answer.answer,
          needsTTS: data.needsTTS,
          endUserDetails: answer.endUserDetails,
        });
        break;
      case 'get-language':
        const lang = await this.geminiService.detectLanguage(data.content);

        try {
          const lang_json = JSON.parse(lang);
          client.emit('message', {
            event: 'language',
            content: lang_json,
          });
        } catch (e) {
          console.error(e.message);
        }
        break;
      case 'translate':
        const toUserLanguage = data.content.targetLanguage !== 'en';
        if (toUserLanguage) {
          client.emit('message', {
            event: 'articulating',
            content: 'Translating...',
          });
        }

        const translated =
          'मैंने सेरेब्रल पाल्सी वाले व्यक्तियों के लिए कौशल में सुधार के लिए कुछ प्रभावी रणनीतियाँ खोजी हैं। ये दृष्टिकोण गतिशीलता, ठीक मोटर कौशल और हाथ-आँख समन्वय को बढ़ाने पर केंद्रित हैं।\n\n**यहाँ प्रोजेक्ट डिस्कवरी द्वारा प्रमाणित कुछ समाधान दिए गए हैं**:\n\n1. **चलने के अभ्यास के लिए रस्सी का उपयोग**: रस्सी की मदद से चलने का अभ्यास करने से गतिशीलता में सुधार हो सकता है। एक दीवार से दूसरी दीवार तक चलते समय रस्सी को पकड़े हुए, व्यक्ति अपने संतुलन और ताकत पर काम कर सकते हैं।\n\nस्रोत:\n[Rope used as a support while walking | Break Free Solutions](https://www.youtube.com/watch?v=0BkdSsPAVho)\n\n2. **बोतल भरने की गतिविधि**: इस गतिविधि में इसके संकीर्ण उद्घाटन के माध्यम से एक बोतल में ग्राम अनाज डालना शामिल है। यह ठीक मोटर कौशल और आँख-हाथ समन्वय को बेहतर बनाने के लिए डिज़ाइन किया गया है। समय के साथ, यह अभ्यास इन क्षेत्रों में महत्वपूर्ण सुधार ला सकता है।\n\nस्रोत:\n[Bottle filling activity for improved fine motor skill & hand-eye coordination | Break Free Solutions](https://www.youtube.com/watch?v=LN-hIyJewsw)\n\n3. **हाथ की पकड़ को बढ़ावा देने वाली मजेदार गतिविधियाँ**: एक रचनात्मक व्यायाम में कटे हुए साइकिल ट्यूब का उपयोग शामिल है जो छोटी, नरम स्माइली गेंदों से भरे हुए हैं जो एक स्टैंड से बंधे होते हैं। यह सेटअप व्यक्ति को वस्तुओं को पकड़ने और हेरफेर करने के लिए प्रोत्साहित करता है, जिससे सकल और ठीक मोटर कौशल में सुधार होता है और हाथ की पकड़ मजबूत होती है।\n\nस्रोत:\n[Fun ways to boost hand grip | Break Free Solutions](https://www.youtube.com/watch?v=6tzur7CXwzw)\n\nये रणनीतियाँ दैनिक दिनचर्या में मजेदार और व्यावहारिक अभ्यासों को शामिल करके सेरेब्रल पाल्सी से जुड़ी विशिष्ट चुनौतियों का समाधान करने पर केंद्रित हैं। यदि आपके कोई और प्रश्न हैं या आपको अपनी आवश्यकताओं के अनुरूप अतिरिक्त सुझावों की आवश्यकता है, तो बेझिझक पूछें!';

        // const translated = await this.geminiService.translateText(
        //   data.content.text,
        //   data.content.targetLanguage,
        // );

        if (toUserLanguage) {
          client.emit('message', {
            event: 'articulating',
            content: '',
            clearTrigger: true,
          });
        }

        client.emit('message', {
          event: 'translation',
          content: translated,
          needsTTS: data.needsTTS,
          toUserLanguage,
        });
        break;
      case 'question-voice':
        client.emit('message', {
          event: 'articulating',
          content: 'Transcribing...',
        });

        // const transcription = await this.geminiService.transcribeAudio(
        //   data.content.toString('base64'),
        // );

        const transcription = "Can I teach if I can't speak?";

        client.emit('message', {
          event: 'answer-voice',
          content: transcription,
        });
        break;
      case 'tts':
        // const ttsText = this.chatService.prepareTTSText(data.content);
        // const fileURL = await this.chatService.generateTTS(
        //   client.id,
        //   ttsText.text,
        // );

        // const linkText = ttsText.links
        //   .map((link) => {
        //     return `${link.title}${link.url}`;
        //   })
        //   .join('\n\n');

        const linkText =
          '[Rope used as a support while walking | Break Free Solutions](https://www.youtube.com/watch?v=0BkdSsPAVho)\n\n[Bottle filling activity for improved fine motor skill & hand-eye coordination | Break Free Solutions](https://www.youtube.com/watch?v=LN-hIyJewsw)\n\n[Fun ways to boost hand grip | Break Free Solutions](https://www.youtube.com/watch?v=6tzur7CXwzw)';
        const fileURL = 'ca83f2f8-4b37-44ed-bd6e-ab21a85bdddd.mp3';

        client.emit('message', {
          event: 'tts',
          content: {
            text: linkText,
            url: fileURL,
          },
        });
        break;
      default:
        break;
    }
  }
}

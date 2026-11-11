import { Module } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AudioModule } from './audio/audio.module';
import { AuthModule } from './auth/auth.module';
import { DeveloperModule } from './developer/developer.module';
import { ProfileModule } from './profile/profile.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { DictionaryModule } from './dictionary/dictionary.module';
import { TranslateModule } from './translate/translate.module';
import { AiModule } from 'src/ai/ai.module';
import { PushModule } from './push/push.module';
import { AgentModule } from './agent/agent.module';
import { ConversationsModule } from './conversations/conversations.module';
import { CommerceModule } from './commerce/commerce.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    AiModule,
    AudioModule,
    AuthModule,
    DictionaryModule,
    TranslateModule,
    ProfileModule,
    BookmarkModule,
    DeveloperModule,
    WebhooksModule,
    AgentModule,
    PushModule,
    ConversationsModule,
    CommerceModule,
    WhatsappModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  controllers: [],
})
export class ApiModule {}

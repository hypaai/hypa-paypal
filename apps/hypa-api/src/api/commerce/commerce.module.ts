import { Module } from '@nestjs/common';
import { CommerceController } from './commerce.controller';
import { CommerceReceiptController } from './commerce-receipt.controller';
import { CommerceService } from './commerce.service';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [WebhooksModule],
  controllers: [CommerceController, CommerceReceiptController],
  providers: [CommerceService],
  exports: [CommerceService],
})
export class CommerceModule {}

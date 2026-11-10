import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CommerceService } from './commerce.service';

/**
 * The customer's receipt, with no merchant login. PayPal redirects the customer
 * here with a Hypa-issued, unguessable receipt token. Neither the public order
 * id nor PayPal's order reference grants access to receipt details.
 */
@Controller('commerce/receipt')
export class CommerceReceiptController {
  constructor(private readonly commerce: CommerceService) {}

  @Get(':id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  getReceipt(@Param('id') id: string, @Headers('x-receipt-token') token = '') {
    if (!token) throw new BadRequestException('A receipt token is required');
    return this.commerce.getReceipt(id, token);
  }

  @Post(':id/reconcile')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  reconcileReceipt(@Param('id') id: string, @Headers('x-receipt-token') token = '') {
    if (!token) throw new BadRequestException('A receipt token is required');
    return this.commerce.reconcileReceipt(id, token);
  }
}

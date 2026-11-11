import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { User } from 'src/libs/shared/decorator/user.decorator';
import type { UserType } from 'src/db-types';
import { CommerceService } from './commerce.service';
import { parseApproveOrder, parseCreateCustomer, parseCreateOrder, parseUpdateOrder } from './commerce.dto';

@UseGuards(AuthGuard)
@Controller('commerce')
export class CommerceController {
  constructor(private readonly commerce: CommerceService) {}

  @Post('customers')
  createCustomer(@Body() body: unknown, @User() user: UserType) {
    try {
      return this.commerce.createCustomer(user.id, parseCreateCustomer(body));
    } catch (error) {
      if (error instanceof Error && !(error instanceof BadRequestException)) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post('orders')
  createOrder(@Body() body: unknown, @User() user: UserType) {
    try {
      return this.commerce.createOrder(user.id, parseCreateOrder(body));
    } catch (error) {
      if (error instanceof Error && !(error instanceof BadRequestException)) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string, @User() user: UserType) {
    return this.commerce.getOrder(user.id, id);
  }

  @Get('orders/:id/approval')
  getOrderApproval(@Param('id') id: string, @User() user: UserType) {
    return this.commerce.getOrderApproval(user.id, id);
  }

  @Patch('orders/:id')
  updateOrder(@Param('id') id: string, @Body() body: unknown, @User() user: UserType) {
    try {
      return this.commerce.updateOrder(user.id, id, parseUpdateOrder(body));
    } catch (error) {
      if (error instanceof Error && !(error instanceof BadRequestException)) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post('orders/:id/approve')
  approveOrder(@Param('id') id: string, @Body() body: unknown, @User() user: UserType) {
    try {
      return this.commerce.updateOrderStatus(user.id, id, 'approved', parseApproveOrder(body));
    } catch (error) {
      if (error instanceof Error && !(error instanceof BadRequestException)) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post('orders/:id/cancel')
  cancelOrder(@Param('id') id: string, @User() user: UserType) {
    return this.commerce.updateOrderStatus(user.id, id, 'cancelled');
  }

  @Post('orders/:id/checkout')
  createCheckout(@Param('id') id: string, @User() user: UserType) {
    return this.commerce.createCheckout(user.id, id);
  }

  @Get('customers')
  listCustomers(@User() user: UserType) {
    return this.commerce.listCustomers(user.id);
  }

  @Get('payment-methods')
  listPaymentMethods(
    @Query('country') country = '',
    @Query('currency') currency = '',
  ) {
    return this.commerce.listPaymentMethods(country, currency);
  }
}

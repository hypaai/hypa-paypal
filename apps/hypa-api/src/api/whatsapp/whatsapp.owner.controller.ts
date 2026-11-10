import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { type UserType } from 'src/db-types';
import { User } from 'src/libs/shared/decorator/user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { WhatsappOwnerService } from './whatsapp.owner.service';
import { WhatsappPaymentService } from './whatsapp.payment';
import { WhatsappService } from './whatsapp.service';

class ConnectNumberDto {
  @IsObject() profile: Record<string, unknown>;
  @IsOptional() @IsBoolean() autoReply?: boolean;
}

class UpdateNumberDto {
  @IsOptional() @IsObject() profile?: Record<string, unknown>;
  @IsOptional() @IsBoolean() autoReply?: boolean;
}

class TextDto {
  @IsString() @MinLength(1) @MaxLength(4096) text: string;
}

class OptionalTextDto {
  @IsOptional() @IsString() @MaxLength(4096) text?: string;
}

class ModeDto {
  @IsIn(['agent', 'owner']) mode: 'agent' | 'owner';
}

/** Hypa Bridge in the Intelligence app: connect the number, read the customer threads, approve or take over. */
@UseGuards(AuthGuard)
@Controller('v2/whatsapp')
export class WhatsappOwnerController {
  constructor(
    private readonly owner: WhatsappOwnerService,
    private readonly bridge: WhatsappService,
    private readonly payment: WhatsappPaymentService,
  ) {}

  @Get('number')
  number(@User() user: UserType) {
    return this.owner.getNumber(user.id);
  }

  @Post('number')
  connect(@Body() body: ConnectNumberDto, @User() user: UserType) {
    return this.owner.connect(user.id, body);
  }

  @Patch('number')
  update(@Body() body: UpdateNumberDto, @User() user: UserType) {
    return this.owner.update(user.id, body);
  }

  @Get('threads')
  threads(@User() user: UserType) {
    return this.owner.threads(user.id);
  }

  @Get('threads/:id')
  thread(@Param('id') id: string, @User() user: UserType) {
    return this.owner.thread(user.id, id);
  }

  @Post('threads/:id/mode')
  async mode(@Param('id') id: string, @Body() body: ModeDto, @User() user: UserType) {
    await this.bridge.setMode(user.id, id, body.mode);
    return { mode: body.mode };
  }

  @Post('threads/:id/reply')
  async reply(@Param('id') id: string, @Body() body: TextDto, @User() user: UserType) {
    await this.bridge.reply(user.id, id, body.text);
    return { sent: true };
  }

  @Post('drafts/:id/send')
  async send(@Param('id') id: string, @Body() body: OptionalTextDto, @User() user: UserType) {
    const draft = await this.bridge.send(user.id, id, body.text);
    return { status: draft.status };
  }

  @Post('orders/:id/payment-link')
  async paymentLink(@Param('id') id: string, @User() user: UserType) {
    await this.payment.resendLink(user.id, id);
    return { sent: true };
  }

  @Post('drafts/:id/discard')
  async discard(@Param('id') id: string, @User() user: UserType) {
    await this.bridge.discard(user.id, id);
    return { discarded: true };
  }
}

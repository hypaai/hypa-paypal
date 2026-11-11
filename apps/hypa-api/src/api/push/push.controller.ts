import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { User } from 'src/libs/shared/decorator/user.decorator';
import type { UserType } from 'src/db-types';
import { PushService } from './push.service';

/** The app tells the API which phone to notify. Only the signed-in account's own phones. */
@UseGuards(AuthGuard)
@Controller('v2/push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Post('register')
  register(@Body() body: { token?: unknown; platform?: unknown }, @User() user: UserType) {
    return this.push.register(user.id, body?.token, body?.platform);
  }

  @Post('unregister')
  unregister(@Body() body: { token?: unknown }, @User() user: UserType) {
    return this.push.unregister(user.id, body?.token);
  }
}

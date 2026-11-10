import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';
import { type UserType } from 'src/db-types';
import { User } from 'src/libs/shared/decorator/user.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { PushService } from './push.service';

class TokenDto {
  @IsString() @Matches(/^Expo(nent)?PushToken\[[^\]]+\]$/) token: string;
}

/** The app hands over its Expo push token after sign-in, and takes it back on sign-out. */
@UseGuards(AuthGuard)
@Controller('v2/push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Post('token')
  async register(@Body() body: TokenDto, @User() user: UserType) {
    await this.push.register(user.id, body.token);
    return { registered: true };
  }

  @Delete('token')
  async unregister(@Body() body: TokenDto, @User() user: UserType) {
    await this.push.unregister(user.id, body.token);
    return { registered: false };
  }
}

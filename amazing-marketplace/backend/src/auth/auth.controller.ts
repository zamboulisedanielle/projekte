import { Body, Controller, Get, Post } from '@nestjs/common';
import { Auth, CurrentUser } from '../common/auth.decorator';
import { JwtUser } from '../common/auth.guard';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @Auth()
  me(@CurrentUser() user: JwtUser) {
    return { id: user.sub, email: user.email, name: user.name, role: user.role };
  }
}

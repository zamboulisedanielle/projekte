import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtUser } from '../common/auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Mit dieser E-Mail-Adresse gibt es bereits ein Konto.');
    }
    const user = await this.prisma.user.create({
      data: { email, name: dto.name.trim(), role: dto.role, passwordHash: await bcrypt.hash(dto.password, 10) },
    });
    return this.session(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-Mail oder Passwort ist falsch.');
    }
    return this.session(user);
  }

  private async session(user: User) {
    const payload: JwtUser = { sub: user.id, email: user.email, name: user.name, role: user.role };
    return {
      token: await this.jwt.signAsync(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}

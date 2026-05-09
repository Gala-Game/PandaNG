import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<{ id: string; email: string; role: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, passwordHash: true, role: true, status: true },
    });

    if (!user) throw new UnauthorizedException('Invalid email or password');
    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    return { id: user.id, email: user.email, role: user.role };
  }
}

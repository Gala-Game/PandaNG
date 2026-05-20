import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { generateSecureToken, sha256 } from '@panda-ng/utils';
import type { AuthTokenPair } from '@panda-ng/types';

const BCRYPT_ROUNDS = 12;

/** Parse JWT expiry strings like '15m', '7d', '3600s', '1h' → seconds */
function parseExpiryToSeconds(expiry: string): number {
  const num = parseInt(expiry, 10);
  if (expiry.endsWith('s')) return num;
  if (expiry.endsWith('m')) return num * 60;
  if (expiry.endsWith('h')) return num * 3600;
  if (expiry.endsWith('d')) return num * 86400;
  return num; // assume raw seconds if no unit
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
    ipAddress: string,
  ): Promise<{ user: { id: string; email: string; username: string }; tokens: AuthTokenPair }> {
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingByEmail) {
      throw new ConflictException('An account with this email already exists');
    }

    const existingByUsername = await this.prisma.user.findUnique({
      where: { username: dto.username.toLowerCase() },
    });
    if (existingByUsername) {
      throw new ConflictException('This username is already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const referralCode = generateSecureToken(4).toUpperCase();

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          username: dto.username.toLowerCase(),
          passwordHash,
          phoneNumber: dto.phoneNumber,
          country: dto.country,
          referralCode,
        },
        select: { id: true, email: true, username: true, role: true },
      });

      await tx.wallet.create({
        data: { userId: newUser.id },
      });

      if (dto.referralCode) {
        const referrer = await tx.user.findUnique({
          where: { referralCode: dto.referralCode },
          select: { id: true },
        });
        if (referrer) {
          await tx.user.update({
            where: { id: newUser.id },
            data: { referredById: referrer.id },
          });
        }
      }

      return newUser;
    });

    this.logger.log(`New user registered: ${user.email} from ${ipAddress}`);

    const tokens = await this.issueTokenPair(user.id, user.email, user.role);

    return {
      user: { id: user.id, email: user.email, username: user.username },
      tokens,
    };
  }

  async login(
    dto: LoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ user: object; tokens: AuthTokenPair }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        role: true,
        status: true,
        vipLevel: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.role);

    const tokenHash = sha256(tokens.refreshToken);
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
    });

    this.logger.log(`User logged in: ${user.email} from ${ipAddress}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        vipLevel: user.vipLevel,
      },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokenPair> {
    const tokenHash = sha256(refreshToken);

    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, role: true, status: true } } },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (session.user.status === 'BANNED' || session.user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account is not active');
    }

    // Revoke old session (token rotation)
    await this.prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    const newTokens = await this.issueTokenPair(
      session.user.id,
      session.user.email,
      session.user.role,
    );

    const newTokenHash = sha256(newTokens.refreshToken);
    await this.prisma.session.create({
      data: {
        userId: session.user.id,
        tokenHash: newTokenHash,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return newTokens;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = sha256(refreshToken);
    await this.prisma.session.updateMany({
      where: { userId, tokenHash, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    // Always return success to prevent email enumeration
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (user) {
      // TODO: Generate reset token, store in Redis, send email via notification service
      this.logger.log(`Password reset requested for ${email}`);
    }

    return { message: 'If an account exists with this email, a reset link has been sent.' };
  }

  resetPassword(token: string, newPassword: string): { message: string } {
    // TODO: Validate reset token from Redis
    void newPassword;
    this.logger.log(`Password reset attempted with token: ${token.substring(0, 8)}...`);
    throw new BadRequestException(
      'Password reset via token not yet fully implemented. Please contact support.',
    );
  }

  async getMe(userId: string): Promise<object> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        kycStatus: true,
        vipLevel: true,
        vipXp: true,
        phoneNumber: true,
        country: true,
        timezone: true,
        avatarUrl: true,
        referralCode: true,
        lastLoginAt: true,
        createdAt: true,
        wallet: {
          select: {
            balanceInCents: true,
            bonusBalanceInCents: true,
            currency: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async verifyToken(token: string): Promise<{ userId: string; email: string; role: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: string;
      }>(token);
      return { userId: payload.sub, email: payload.email, role: payload.role };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async issueTokenPair(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthTokenPair> {
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRY') ?? '15m';
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRY') ?? '7d';
    const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: accessExpiresIn }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    const expiresInSeconds = parseExpiryToSeconds(accessExpiresIn);

    return { accessToken, refreshToken, expiresIn: expiresInSeconds };
  }
}

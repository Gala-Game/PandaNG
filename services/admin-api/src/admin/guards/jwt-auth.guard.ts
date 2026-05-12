import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();

    // Support both Bearer JWT and X-Admin-Api-Key header
    const apiKey = request.headers['x-admin-api-key'];
    if (apiKey && typeof apiKey === 'string') {
      const validApiKey = this.configService.get<string>('ADMIN_API_KEY');
      if (validApiKey && apiKey === validApiKey) {
        // Internal service-to-service call
        request.user = { sub: 'system', email: 'system@panda-ng.internal', role: 'ADMIN', iat: 0, exp: 0 };
        return true;
      }
    }

    const authHeader = request.headers['authorization'];
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }

    const token = authHeader.slice(7);

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        issuer: 'panda-ng',
        audience: 'panda-ng-client',
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

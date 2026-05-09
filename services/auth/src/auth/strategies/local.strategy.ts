import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<object> {
    const result = await this.authService.login(
      { email, password },
      'local-strategy',
      'local-strategy',
    );
    if (!result) throw new UnauthorizedException();
    return result;
  }
}

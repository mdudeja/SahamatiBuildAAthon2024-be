import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';
import { User } from 'src/services/user/user.schema';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  async validate(
    username: string,
    password: string,
  ): Promise<
    | {
        success: boolean;
        user: User;
        token?: string;
        message: string;
      }
    | undefined
  > {
    const loginResponse = await this.authService.loginUser(username, password);

    if (!loginResponse.success) {
      throw new UnauthorizedException();
    }

    return {
      ...loginResponse,
      user: loginResponse.user,
    };
  }
}

import {
  ClassSerializerInterceptor,
  Injectable,
  UseInterceptors,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/services/user/user.service';
import { Request } from 'express';
import { IUserPayload } from './auth.service';
import { User } from 'src/services/user/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  private static extractJWT(req: Request): string | null {
    if (req.cookies) {
      return req.cookies['token'];
    }
  }

  @UseInterceptors(ClassSerializerInterceptor)
  async validate(payload: IUserPayload): Promise<User | undefined> {
    const { username, userType } = payload;
    const user = await this.userService.findOne(username, userType);
    if (user) {
      return user.toJSON();
    }
  }
}

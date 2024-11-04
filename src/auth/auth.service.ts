import { Injectable } from '@nestjs/common';
import { randomBytes, pbkdf2Sync } from 'crypto';
import { UserService } from 'src/services/user/user.service';
import { User, UserDocument } from 'src/services/user/user.schema';
import { JwtService } from '@nestjs/jwt';

export type IUserPayload = Pick<UserDocument, 'username' | 'userType'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    return `${salt}--||--${hash}`;
  }

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const [salt, hash] = hashedPassword.split('--||--');
    const hashVerify = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString(
      'hex',
    );

    return hash === hashVerify;
  }

  async validateUser(
    username: string,
    password: string,
    userType?: User['userType'],
  ): Promise<User> {
    const user = await this.userService.findOne(username, userType ?? 'fiu');

    if (user && (await this.validatePassword(password, user.password))) {
      return {
        ...user.toJSON(),
        password: undefined,
      };
    }

    return null;
  }

  async registerUser(user: User): Promise<User> {
    const hashedPassword = await this.hashPassword(user.password);
    const newUser = {
      ...user,
      password: hashedPassword,
    };

    const createdUser = await this.userService.create(newUser);

    return createdUser.toJSON();
  }

  async loginUser(
    username: string,
    password: string,
    userType?: User['userType'],
  ): Promise<
    | {
        success: boolean;
        user: User | null;
        token?: string;
        message: string;
      }
    | undefined
  > {
    const user = await this.validateUser(username, password, userType);

    if (!user) {
      return {
        success: false,
        message: 'Invalid username or password',
        user: null,
      };
    }

    return {
      success: true,
      user: user,
      token: this.jwtService.sign({
        username,
        userType: user.userType,
        id: user._id.toString(),
      }),
      message: 'Login successful',
    };
  }
}

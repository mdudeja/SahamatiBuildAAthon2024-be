import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from 'src/services/user/user.schema';
import { Response } from 'express';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async registerUser(
    @Body()
    body: {
      username: string;
      password: string;
      userType: User['userType'];
    },
  ): Promise<User> {
    const registeredUser = await this.authService.registerUser(
      body as unknown as User,
    );
    return registeredUser;
  }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async loginUser(
    @Body()
    body: {
      username: string;
      password: string;
      userType?: User['userType'];
    },
    @Res() response: Response,
  ) {
    const loginResponse = await this.authService.loginUser(
      body.username,
      body.password,
      body.userType,
    );

    if (loginResponse.success) {
      response.cookie('token', loginResponse.token);
    }

    response.json(loginResponse);
  }
}

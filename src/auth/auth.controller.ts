import { Body, Controller, Post, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginInput, LoginOutput, RegisterInput } from './contracts';
import { Public } from '@decorators/public.decorator';

@ApiTags('Autenticação')
@Controller()
export class AuthController {
  constructor(readonly authService: AuthService) { }

  @Public()
  @ApiOperation({ summary: 'Autenticação de usuário' })
  @ApiResponse({ status: 200, description: 'Usuário logado com sucesso', type: LoginOutput })
  @Post('login')
  async login(@Body() loginDto: LoginInput) {
    return this.authService.login(loginDto.email.toLocaleLowerCase(), loginDto.password);
  }

  @Public()
  @Post('register')
  async register(@Body() body: RegisterInput) {
    return this.authService.register(body.email.toLocaleLowerCase(), body.password, body.name);
  }
}

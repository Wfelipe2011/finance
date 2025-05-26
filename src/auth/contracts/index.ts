import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginInput {
  @ApiProperty({ description: 'Email do usuário', example: 'john@gmail.com', required: true })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ description: 'Senha do usuário', example: '123456', required: true })
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;
}

export class LoginOutput {
  @ApiProperty({ description: 'Token JWT', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;
}

export class RegisterInput {
  @ApiProperty({ description: 'Email do usuário', example: 'john@gmail.com', required: true })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ description: 'Senha do usuário', example: '123456', required: true })
  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;

  @ApiProperty({ description: 'Nome do usuário', example: 'John Doe', required: true })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;
}

export class UserToken {
  id: string;
  userId: number;
  tenantId: number;
  constructor(id: string, userId: number, tenancy: number) {
    this.id = id;
    this.userId = userId;
    this.tenantId = tenancy;
  }
}

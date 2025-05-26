import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AuthService {
  logger = new Logger(AuthService.name);
  constructor(private prisma: PrismaService) { }

  async login(email: string, password: string) {
    this.logger.log(`login ${email}`);
    const user = await this.prisma.usuarios.findUnique({
      where: {
        email,
      },
    });
    this.logger.log(`Verificando usuário ${user?.email}`);
    if (!user) throw new UnauthorizedException('Não autorizado');
    this.logger.log(`Verificando senha ${user?.email}`);
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Não autorizado');
    this.logger.log(`Gerando token ${user?.email}`);
    const token = jwt.sign(
      {
        id: uuid(),
        userId: user.id,
        userName: user.nome,
        tenantId: user.tenantId,
      },
      process.env['JWT_SECRET'],
      {
        expiresIn: '1d',
      }
    );

    return { token };
  }

  async register(email: string, password: string, nome: string) {
    this.logger.log(`register ${email}`);

    const tenant = await this.prisma.tenants.create({
      data: {
        nome: `T-${nome}`,
      }
    });
    
    const existingUser = await this.prisma.usuarios.findUnique({
      where: {
        email,
      },
    });
    
    if (existingUser) throw new BadRequestException('Usuário já existe');

    const hashedPassword = this.hashPassword(password);
    
    try {
      const user = await this.prisma.usuarios.create({
        data: {
          email,
          password: hashedPassword.password,
          nome,
          tenantId: tenant.id
        },
      });
      return { user };
    } catch (error) {
      this.logger.error(`Erro ao registrar usuário: ${error['message'] || error}`);
      throw new InternalServerErrorException('Erro ao registrar usuário');
    }
  }

  hashPassword(password: string) {
    return {
      password: bcrypt.hashSync(password, 10),
    }
  }
}



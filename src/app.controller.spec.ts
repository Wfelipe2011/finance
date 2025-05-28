import "dotenv/config";
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppController } from './app.controller';

// configurar timeout para 1 minuto
jest.setTimeout(60 * 5000);

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // afterAll(async () => {
  //   await app.close();
  // });

  it('should return mocked response from graph.invoke', async () => {
    const message_1 = 'olá'
    const message_2 = 'Quai são os meus ultimos extratos bancários?'

    const response_1 = await ivoke(message_1)
    const response_2 = await ivoke(message_2)

    console.time('ATENDIMENTO')
    console.log('User:', message_1);
    console.log('AI:', response_1);
    console.log('User:', message_2);
    console.log('AI:', response_2);
    console.timeEnd('ATENDIMENTO')
  });

  // UpdatedSchedulerAgent

  it('Testar UpdatedSchedulerAgent', async () => {
    const message = 'Olá, gostaria de agendar um corte de cabelo para amanhã às 10h da manhã'
    const response = await ivoke(message)
    console.log('Resposta do agente:', response);

  })

  async function ivoke(message: string) {
    const { body } = await request(app.getHttpServer())
      .post('/receiver')
      .send({ chatInput: message }) as any

    return body.response
  }
});
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/game/start (POST)', () => {
    return request(app.getHttpServer())
      .post('/game/start')
      .expect(201)
      .expect('Game started!');
  });

  it('/game/draw (POST)', () => {
    return request(app.getHttpServer())
      .post('/game/draw')
      .expect(201)
      .expect('Number drawn!');
  });
});

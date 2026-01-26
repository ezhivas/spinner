import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpMethod } from '../src/requests/request.entity';

describe('API Client E2E Tests', () => {
  let app: INestApplication<App>;
  let createdRequestId: number;
  let createdCollectionId: number;
  let createdEnvironmentId: number;

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

  describe('Requests API', () => {
    it('POST /requests - should create a request', async () => {
      const response = await request(app.getHttpServer())
        .post('/requests')
        .send({
          name: 'Test Request E2E',
          method: HttpMethod.GET,
          url: 'https://jsonplaceholder.typicode.com/users/1',
          headers: { 'Content-Type': 'application/json' },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Request E2E');
      createdRequestId = response.body.id;
    });

    it('POST /requests - should reject malicious post-request script', async () => {
      await request(app.getHttpServer())
        .post('/requests')
        .send({
          name: 'Malicious Request',
          method: HttpMethod.GET,
          url: 'https://api.example.com',
          postRequestScript: 'require("fs").readFileSync("/etc/passwd");',
        })
        .expect(400);
    });

    it('GET /requests - should return all requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/requests')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('GET /requests/:id - should return specific request', async () => {
      const response = await request(app.getHttpServer())
        .get(`/requests/${createdRequestId}`)
        .expect(200);

      expect(response.body.id).toBe(createdRequestId);
      expect(response.body.name).toBe('Test Request E2E');
    });

    it('PATCH /requests/:id - should update request', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/requests/${createdRequestId}`)
        .send({
          name: 'Updated Request E2E',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Request E2E');
    });

    it('PATCH /requests/:id - should reject malicious script update', async () => {
      await request(app.getHttpServer())
        .patch(`/requests/${createdRequestId}`)
        .send({
          postRequestScript: 'eval("malicious code");',
        })
        .expect(400);
    });
  });

  describe('Collections API', () => {
    it('POST /collections - should create a collection', async () => {
      const response = await request(app.getHttpServer())
        .post('/collections')
        .send({
          name: 'Test Collection E2E',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Collection E2E');
      createdCollectionId = response.body.id;
    });

    it('GET /collections - should return all collections', async () => {
      const response = await request(app.getHttpServer())
        .get('/collections')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /collections/:id - should return specific collection', async () => {
      const response = await request(app.getHttpServer())
        .get(`/collections/${createdCollectionId}`)
        .expect(200);

      expect(response.body.id).toBe(createdCollectionId);
    });

    it('PATCH /collections/:id - should update collection', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/collections/${createdCollectionId}`)
        .send({
          name: 'Updated Collection E2E',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Collection E2E');
    });
  });

  describe('Environments API', () => {
    it('POST /environments - should create an environment', async () => {
      const response = await request(app.getHttpServer())
        .post('/environments')
        .send({
          name: 'Test Environment E2E',
          variables: {
            BASE_URL: 'https://api.test.com',
            API_KEY: 'test-key-123',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Environment E2E');
      expect(response.body.variables.BASE_URL).toBe('https://api.test.com');
      createdEnvironmentId = response.body.id;
    });

    it('GET /environments - should return all environments', async () => {
      const response = await request(app.getHttpServer())
        .get('/environments')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /environments/:id - should return specific environment', async () => {
      const response = await request(app.getHttpServer())
        .get(`/environments/${createdEnvironmentId}`)
        .expect(200);

      expect(response.body.id).toBe(createdEnvironmentId);
      expect(response.body.variables).toHaveProperty('BASE_URL');
    });

    it('PATCH /environments/:id/variables - should update variables', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/environments/${createdEnvironmentId}/variables`)
        .send({
          NEW_VAR: 'new-value',
        })
        .expect(200);

      expect(response.body.variables.NEW_VAR).toBe('new-value');
      expect(response.body.variables.BASE_URL).toBe('https://api.test.com');
    });
  });

  describe('Cleanup', () => {
    it('DELETE /requests/:id - should delete request', async () => {
      await request(app.getHttpServer())
        .delete(`/requests/${createdRequestId}`)
        .expect(200);
    });

    it('DELETE /collections/:id - should delete collection', async () => {
      await request(app.getHttpServer())
        .delete(`/collections/${createdCollectionId}`)
        .expect(200);
    });

    it('DELETE /environments/:id - should delete environment', async () => {
      await request(app.getHttpServer())
        .delete(`/environments/${createdEnvironmentId}`)
        .expect(200);
    });
  });
});

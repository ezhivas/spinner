import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { CurlConverterService } from './curl-converter-httpsnippet.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EnvironmentEntity } from '../environments/environment.entity';

describe('RequestsController', () => {
  let controller: RequestsController;

  const mockRequestsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockCurlConverter = {
    curlToRequest: jest.fn(),
    requestToCurl: jest.fn(),
  };

  const mockEnvRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        {
          provide: RequestsService,
          useValue: mockRequestsService,
        },
        {
          provide: CurlConverterService,
          useValue: mockCurlConverter,
        },
        {
          provide: getRepositoryToken(EnvironmentEntity),
          useValue: mockEnvRepo,
        },
      ],
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

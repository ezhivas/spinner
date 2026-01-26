import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequestsService } from './requests.service';
import { RequestEntity } from './request.entity';
import { PostRequestScriptService } from './post-request-script.service';

describe('RequestsService', () => {
  let service: RequestsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    manager: {
      findOne: jest.fn(),
    },
  };

  const mockPostRequestScriptService = {
    validateScript: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(RequestEntity),
          useValue: mockRepository,
        },
        {
          provide: PostRequestScriptService,
          useValue: mockPostRequestScriptService,
        },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

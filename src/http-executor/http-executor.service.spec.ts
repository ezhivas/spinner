import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpExecutorService } from './http-executor.service';

describe('HttpExecutorService', () => {
  let service: HttpExecutorService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue(60000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpExecutorService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<HttpExecutorService>(HttpExecutorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { HttpExecutorService } from './http-executor.service';

describe('HttpExecutorService', () => {
  let service: HttpExecutorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExecutorService],
    }).compile();

    service = module.get<HttpExecutorService>(HttpExecutorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

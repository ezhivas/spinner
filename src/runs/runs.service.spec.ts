import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RunsService } from './runs.service';
import { RequestRunEntity } from './request-run.entity';
import { RequestEntity } from '../requests/request.entity';
import { EnvironmentEntity } from '../environments/environment.entity';
import { HttpExecutorService } from '../http-executor/http-executor.service';
import { VariableResolverService } from '../environments/variable-resolver.service';
import { PostRequestScriptService } from '../requests/post-request-script.service';

describe('RunsService', () => {
  let service: RunsService;

  const mockRunRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockRequestRepository = {
    findOneBy: jest.fn(),
  };

  const mockEnvironmentRepository = {
    findOneBy: jest.fn(),
  };

  const mockHttpExecutor = {
    execute: jest.fn(),
  };

  const mockVariableResolver = {
    resolve: jest.fn(),
  };

  const mockPostRequestScriptService = {
    executeScript: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RunsService,
        {
          provide: getRepositoryToken(RequestRunEntity),
          useValue: mockRunRepository,
        },
        {
          provide: getRepositoryToken(RequestEntity),
          useValue: mockRequestRepository,
        },
        {
          provide: getRepositoryToken(EnvironmentEntity),
          useValue: mockEnvironmentRepository,
        },
        {
          provide: 'RUNS_QUEUE',
          useValue: null,
        },
        {
          provide: 'IS_ELECTRON',
          useValue: false,
        },
        {
          provide: HttpExecutorService,
          useValue: mockHttpExecutor,
        },
        {
          provide: VariableResolverService,
          useValue: mockVariableResolver,
        },
        {
          provide: PostRequestScriptService,
          useValue: mockPostRequestScriptService,
        },
      ],
    }).compile();

    service = module.get<RunsService>(RunsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

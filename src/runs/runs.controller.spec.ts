import { Test, TestingModule } from '@nestjs/testing';
import { RunsController } from './runs.controller';
import { RunsService } from './runs.service';

describe('RunsController', () => {
  let controller: RunsController;

  const mockRunsService = {
    runRequest: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    cleanup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RunsController],
      providers: [
        {
          provide: RunsService,
          useValue: mockRunsService,
        },
      ],
    }).compile();

    controller = module.get<RunsController>(RunsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

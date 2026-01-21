import { Test, TestingModule } from '@nestjs/testing';
import { HttpExecutorController } from './http-executor.controller';

describe('HttpExecutorController', () => {
  let controller: HttpExecutorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HttpExecutorController],
    }).compile();

    controller = module.get<HttpExecutorController>(HttpExecutorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

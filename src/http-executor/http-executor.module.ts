import { Module } from '@nestjs/common';
import { HttpExecutorService } from './http-executor.service';

@Module({
  providers: [HttpExecutorService],
  exports: [HttpExecutorService],
})
export class HttpExecutorModule {}

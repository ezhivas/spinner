import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentsService } from './environments.service';
import { EnvironmentsController } from './environments.controller';
import { EnvironmentEntity } from './environment.entity';
import { VariableResolverService } from './variable-resolver.service';

@Module({
  imports: [TypeOrmModule.forFeature([EnvironmentEntity])],
  providers: [EnvironmentsService, VariableResolverService],
  controllers: [EnvironmentsController],
  exports: [EnvironmentsService, VariableResolverService],
})
export class EnvironmentsModule {}

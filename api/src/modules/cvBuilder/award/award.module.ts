import { Module, forwardRef } from '@nestjs/common';
import { AwardService } from './award.service';
import { AwardResolver } from './award.resolver';
import { RedisModule } from '@bts-soft/core';
import { CvModule } from '../cv/cv.module';
import { AwardBuilderFactory } from './builder/award-builder.factory';
import { AwardLoader } from './loaders/award.loader';

@Module({
  imports: [RedisModule, forwardRef(() => CvModule)],
  providers: [
    AwardService,
    AwardResolver,
    AwardBuilderFactory,
    AwardLoader,
  ],
  exports: [AwardService, AwardLoader],
})
export class AwardModule {}

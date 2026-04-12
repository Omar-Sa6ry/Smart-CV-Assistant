import { Module } from '@nestjs/common';
import { CvService } from '../services/cv.service';
import { CvResolver } from '../resolvers/cv.resolver';
import { UserModule } from 'src/modules/users/users.module';

@Module({
  imports: [UserModule],
  providers: [CvService, CvResolver],
  exports: [CvService],
})
export class CvModule {}

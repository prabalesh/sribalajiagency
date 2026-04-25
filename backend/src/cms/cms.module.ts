import { Module } from '@nestjs/common';
import { CMSService } from './cms.service';
import { CMSController } from './cms.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [CMSController],
  providers: [CMSService],
  exports: [CMSService],
})
export class CMSModule {}

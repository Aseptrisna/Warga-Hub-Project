import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatrolCheckpoint, PatrolCheckpointSchema } from './schemas/patrol-checkpoint.schema';
import { PatrolSchedule, PatrolScheduleSchema } from './schemas/patrol-schedule.schema';
import { PatrolLog, PatrolLogSchema } from './schemas/patrol-log.schema';
import { PatrolCheckpointsService } from './patrol-checkpoints.service';
import { PatrolSchedulesService } from './patrol-schedules.service';
import { PatrolLogsService } from './patrol-logs.service';
import { PatrolCheckpointsController } from './patrol-checkpoints.controller';
import { PatrolSchedulesController } from './patrol-schedules.controller';
import { PatrolLogsController } from './patrol-logs.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatrolCheckpoint.name, schema: PatrolCheckpointSchema },
      { name: PatrolSchedule.name, schema: PatrolScheduleSchema },
      { name: PatrolLog.name, schema: PatrolLogSchema },
    ]),
  ],
  controllers: [
    PatrolCheckpointsController,
    PatrolSchedulesController,
    PatrolLogsController,
  ],
  providers: [
    PatrolCheckpointsService,
    PatrolSchedulesService,
    PatrolLogsService,
  ],
  exports: [
    PatrolCheckpointsService,
    PatrolSchedulesService,
    PatrolLogsService,
  ],
})
export class PatrolModule {}

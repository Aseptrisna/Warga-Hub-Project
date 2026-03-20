import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type PatrolScheduleDocument = HydratedDocument<PatrolSchedule>;

export enum PatrolShift {
  SIANG = 'Siang', // 06:00 - 18:00
  MALAM = 'Malam', // 18:00 - 06:00
}

export enum PatrolStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class PatrolSchedule extends BaseSchema {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, enum: Object.values(PatrolShift) })
  shift: PatrolShift;

  @Prop({ type: String, required: true })
  regionId: string; // RT/RW/Desa

  @Prop()
  regionName?: string;

  // Region scoping
  @Prop({ required: true })
  desa: string;

  @Prop()
  rw?: string;

  @Prop()
  rt?: string;

  // Assigned officers
  @Prop({ type: [String], default: [] })
  assignedOfficers: string[]; // User IDs

  @Prop({ type: [String], default: [] })
  assignedOfficerNames: string[];

  @Prop({ required: true, enum: Object.values(PatrolStatus), default: PatrolStatus.SCHEDULED })
  status: PatrolStatus;

  // Checkpoint requirements
  @Prop({ type: [String], default: [] })
  requiredCheckpoints: string[]; // Checkpoint IDs

  @Prop({ type: Number, default: 0 })
  totalCheckpoints: number;

  @Prop({ type: Number, default: 0 })
  completedCheckpoints: number;

  // Timing
  @Prop()
  startTime?: Date;

  @Prop()
  endTime?: Date;

  // Notes
  @Prop()
  notes?: string;

  @Prop()
  reportSummary?: string;
}

export const PatrolScheduleSchema = SchemaFactory.createForClass(PatrolSchedule);

PatrolScheduleSchema.index({ desa: 1, rw: 1, rt: 1 });

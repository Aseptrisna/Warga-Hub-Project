import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type AuditLogDocument = HydratedDocument<AuditLog>;

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
export class AuditLog extends BaseSchema {
  @Prop({ type: String })
  userId?: string;

  @Prop()
  userName?: string;

  @Prop()
  userRole?: string;

  @Prop({ required: true, enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'UPLOAD', 'OTHER'] })
  action: string;

  @Prop({ required: true })
  module: string; // e.g., 'citizens', 'payments', 'letters'

  @Prop()
  entityId?: string; // ID of the affected entity

  @Prop()
  entityType?: string; // e.g., 'Citizen', 'Payment'

  @Prop({ required: true })
  description: string;

  @Prop({ type: Object })
  changes?: Record<string, any>; // { field: { old: x, new: y } }

  @Prop()
  ipAddress?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ module: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ entityId: 1, entityType: 1 });

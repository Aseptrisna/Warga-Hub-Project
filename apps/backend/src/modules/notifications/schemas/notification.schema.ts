import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type NotificationDocument = HydratedDocument<Notification>;

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
export class Notification extends BaseSchema {
  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 'info', enum: ['info', 'warning', 'success', 'error'] })
  type: string;

  @Prop()
  module?: string; // e.g., 'payments', 'letters', 'reports'

  @Prop()
  referenceId?: string; // ID of related entity

  @Prop()
  referenceUrl?: string; // Link to navigate to

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

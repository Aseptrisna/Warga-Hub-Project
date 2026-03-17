import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type SettingDocument = HydratedDocument<Setting>;

@Schema()
export class Setting extends BaseSchema {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  value: string;

  @Prop({ required: true, enum: ['general', 'appearance', 'notification', 'security'] })
  category: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isEditable: boolean;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
SettingSchema.index({ category: 1 });
SettingSchema.index({ key: 1 }, { unique: true });

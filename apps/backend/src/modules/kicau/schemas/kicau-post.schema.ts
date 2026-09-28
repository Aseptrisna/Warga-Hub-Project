import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type KicauPostDocument = HydratedDocument<KicauPost>;

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
export class KicauPost extends BaseSchema {
  @Prop({ required: true })
  authorUserId: string;

  @Prop({ required: true })
  authorName: string;

  @Prop({ required: true })
  authorRole: string;

  @Prop({ default: '', maxlength: 500 })
  isi: string;

  @Prop({ type: [String], default: [] })
  fotoUrls: string[];

  @Prop({ required: true })
  desa: string;

  @Prop()
  rw?: string;

  @Prop()
  rt?: string;

  @Prop({ type: [String], default: [] })
  likedBy: string[];

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: false })
  isHidden: boolean;

  @Prop()
  hiddenBy?: string;

  @Prop()
  hiddenReason?: string;
}

export const KicauPostSchema = SchemaFactory.createForClass(KicauPost);

KicauPostSchema.index({ desa: 1, isHidden: 1, createdAt: -1 });

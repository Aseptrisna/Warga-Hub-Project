import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

export type KicauCommentDocument = HydratedDocument<KicauComment>;

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
export class KicauComment extends BaseSchema {
  @Prop({ required: true })
  postId: string;

  @Prop({ required: true })
  authorUserId: string;

  @Prop({ required: true })
  authorName: string;

  @Prop({ required: true, maxlength: 300 })
  isi: string;
}

export const KicauCommentSchema = SchemaFactory.createForClass(KicauComment);

KicauCommentSchema.index({ postId: 1, createdAt: 1 });

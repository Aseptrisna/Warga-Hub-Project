import { Prop, Schema } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * Base Schema
 *
 * All schemas MUST extend this base schema to ensure:
 * - UUID v4 primary key (NOT MongoDB ObjectId)
 * - No versioning (__v disabled)
 * - Automatic timestamps (createdAt, updatedAt)
 *
 * Usage:
 * @Schema()
 * export class User extends BaseSchema {
 *   @Prop({ required: true })
 *   email: string;
 * }
 */
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
  toObject: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class BaseSchema {
  @Prop({
    type: String,
    default: () => uuidv4(),
    required: true,
  })
  _id: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

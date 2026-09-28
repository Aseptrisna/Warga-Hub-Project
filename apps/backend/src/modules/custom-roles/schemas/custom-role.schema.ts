import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';
import { Role } from '../../../common/enums/role.enum';

export type CustomRoleDocument = HydratedDocument<CustomRole>;

/**
 * A custom, admin-defined role. Its API access is delegated entirely to the
 * built-in roles listed in `baseRoles` (RolesGuard treats a user with this
 * role as if they held each of those roles) - this keeps the ~19 existing
 * `@Roles(...)` guards across the codebase working unmodified. `menuPaths`
 * independently controls sidebar visibility and may be a curated subset.
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
})
export class CustomRole extends BaseSchema {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  code: string;

  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], enum: Role, required: true })
  baseRoles: Role[];

  @Prop({ type: [String], default: [] })
  menuPaths: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdBy?: string;

  @Prop()
  createdByName?: string;
}

export const CustomRoleSchema = SchemaFactory.createForClass(CustomRole);

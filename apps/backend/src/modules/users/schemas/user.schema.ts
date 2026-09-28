import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';
import { Role } from '../../../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';

export type UserDocument = HydratedDocument<User>;

@Schema({timestamps: true, versionKey: false})
export class User extends BaseSchema {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  name: string;

  // Plain string (not a strict Mongoose enum) so this can also hold a
  // custom role's `code` (see modules/custom-roles). Validity - built-in
  // Role enum value or an active CustomRole - is enforced in UsersService.
  @Prop({ required: true, type: String, default: Role.WARGA })
  role: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ type: String, required: false })
  citizenId?: string; // Link ke Citizen._id

  @Prop({ trim: true })
  nik?: string; // NIK untuk lookup

  // Multi-tenant region reference
  @Prop({ type: String, required: false })
  regionId?: string; // Reference to Region (Desa/RW/RT)

  // Legacy fields (for backward compatibility, will be deprecated)
  @Prop({ trim: true })
  desa?: string;

  @Prop({ trim: true })
  rw?: string;

  @Prop({ trim: true })
  rt?: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  emailVerificationExpires?: Date;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  @Prop()
  refreshToken?: string;

  @Prop()
  lastLogin?: Date;

  // Method to compare password
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  const user = this as any;

  // Only hash password if it has been modified
  if (!user.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Supports UsersService.findAll/getStatistics filters and sorts
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ desa: 1, rw: 1, rt: 1 });
UserSchema.index({ createdAt: -1 });

// Remove password from JSON output
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.emailVerificationToken;
    delete ret.resetPasswordToken;
    delete ret.refreshToken;
    return ret;
  },
});

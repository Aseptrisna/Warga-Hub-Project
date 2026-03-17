import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';
import { Role } from '../../../common/enums/role.enum';
import * as bcrypt from 'bcrypt';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User extends BaseSchema {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: Role, default: Role.WARGA })
  role: Role;

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

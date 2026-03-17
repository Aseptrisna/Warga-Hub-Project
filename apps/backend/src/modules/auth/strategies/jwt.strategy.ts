import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { User, UserDocument } from '../../users/schemas/user.schema';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userModel.findOne({ _id: payload.sub });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Akun Anda tidak aktif');
    }

    // Return user object that will be attached to request
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      desa: user.desa,
      rw: user.rw,
      rt: user.rt,
      citizenId: user.citizenId,
      nik: user.nik,
    };
  }
}

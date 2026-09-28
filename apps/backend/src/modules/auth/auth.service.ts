import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Citizen } from '../citizens/schemas/citizen.schema';
import { Region, RegionDocument } from '../regions/schemas/region.schema';
import { RegionType } from '../regions/schemas/region.schema';
import { RegisterDto } from './dto/register.dto';
import { RegisterDesaDto, VerifyEmailDto, ResendVerificationDto } from './dto/register-desa.dto';
import { ValidateNikDto } from './dto/validate-nik.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../../common/services/email.service';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Citizen.name) private citizenModel: Model<Citizen>,
    @InjectModel(Region.name) private regionModel: Model<RegionDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  /**
   * Validate NIK - check if citizen exists and has no account yet
   */
  async validateNik(dto: ValidateNikDto) {
    const citizen = await this.citizenModel.findOne({ nik: dto.nik });

    if (!citizen) {
      return {
        valid: false,
        message: 'NIK tidak ditemukan dalam database. Hubungi admin RT/RW Anda untuk mendaftarkan data kependudukan terlebih dahulu.',
      };
    }

    if (citizen.userId) {
      return {
        valid: false,
        message: 'NIK ini sudah terdaftar dengan akun lain.',
      };
    }

    return {
      valid: true,
      nama: citizen.namaLengkap,
      desa: citizen.desa,
      rw: citizen.rw,
      rt: citizen.rt,
    };
  }

  /**
   * Register new user - NIK-based, linked to Citizen
   */
  async register(registerDto: RegisterDto) {
    // 1. Check if email already exists
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // 2. Find citizen by NIK
    const citizen = await this.citizenModel.findOne({ nik: registerDto.nik });

    if (!citizen) {
      throw new BadRequestException(
        'NIK tidak ditemukan. Hubungi admin RT/RW untuk mendaftarkan data kependudukan.',
      );
    }

    // 3. Check if citizen already has an account
    if (citizen.userId) {
      throw new ConflictException('NIK ini sudah terdaftar dengan akun lain.');
    }

    // 4. Create user with isActive=false, role=WARGA, linked to citizen
    const user = new this.userModel({
      email: registerDto.email,
      password: registerDto.password,
      name: registerDto.name,
      phone: registerDto.phone,
      role: Role.WARGA,
      isActive: false,
      isEmailVerified: false,
      citizenId: citizen._id,
      nik: registerDto.nik,
      desa: citizen.desa,
      rw: citizen.rw,
      rt: citizen.rt,
    });

    await user.save();

    // 5. Link citizen back to user
    citizen.userId = user._id as string;
    await citizen.save();

    // 6. Do NOT generate tokens (not active yet)
    return {
      message: 'Registrasi berhasil. Menunggu aktivasi dari admin RT Anda.',
    };
  }

  /**
   * Register Desa — creates Region + AdminDesa user, sends verification email
   */
  async registerDesa(dto: RegisterDesaDto) {
    // 1. Check email not already registered
    const existingUser = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // 2. Generate subdomain from desa name
    const subdomain = dto.desaName
      .toLowerCase()
      .replace(/^desa\s+/i, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check subdomain uniqueness
    const existingRegion = await this.regionModel.findOne({ subdomain });
    if (existingRegion) {
      throw new ConflictException('Nama desa sudah terdaftar. Silakan gunakan nama lain atau hubungi support.');
    }

    // 3. Create Region (type: DESA, isActive: false)
    const region = new this.regionModel({
      name: dto.desaName,
      type: RegionType.DESA,
      subdomain,
      provinsi: dto.provinsi,
      kabupaten: dto.kabupaten,
      kecamatan: dto.kecamatan,
      address: dto.address,
      postalCode: dto.postalCode,
      phone: dto.desaPhone,
      email: dto.desaEmail,
      leaderName: dto.leaderName,
      isActive: false,
    });
    await region.save();

    // 4. Generate email verification token
    const emailVerificationToken = uuidv4();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 5. Create User (AdminDesa, isActive: false)
    const user = new this.userModel({
      email: dto.email.toLowerCase(),
      password: dto.password,
      name: dto.name,
      phone: dto.phone,
      role: Role.ADMIN_DESA,
      desa: dto.desaName,
      regionId: (region as any)._id,
      isActive: false,
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
    });
    await user.save();

    // 6. Send verification email
    await this.emailService.sendVerificationEmail(dto.email, dto.name, emailVerificationToken);

    return {
      message: 'Pendaftaran berhasil! Silakan cek email Anda untuk aktivasi akun.',
    };
  }

  /**
   * Verify email with token — activates user + region if AdminDesa
   */
  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.userModel.findOne({
      emailVerificationToken: dto.token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Token verifikasi tidak valid atau sudah kadaluarsa');
    }

    // Activate user
    user.isActive = true;
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // If AdminDesa, also activate the linked Region
    if (user.role === Role.ADMIN_DESA && user.regionId) {
      await this.regionModel.updateOne(
        { _id: user.regionId },
        { $set: { isActive: true } },
      );
    }

    return {
      message: 'Email berhasil diverifikasi! Silakan login untuk mulai mengelola desa Anda.',
    };
  }

  /**
   * Resend verification email
   */
  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
      isActive: false,
      isEmailVerified: false,
    });

    if (!user) {
      // Don't reveal whether email exists (security)
      return {
        message: 'Jika email terdaftar dan belum terverifikasi, email verifikasi telah dikirim ulang.',
      };
    }

    // Generate new token
    const emailVerificationToken = uuidv4();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    await this.emailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);

    return {
      message: 'Jika email terdaftar dan belum terverifikasi, email verifikasi telah dikirim ulang.',
    };
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      return null;
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Akun Anda belum diaktifkan. Hubungi admin RT Anda untuk aktivasi.',
      );
    }

    return user;
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token and last login
    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return {
      message: 'Login berhasil',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        desa: user.desa,
        rw: user.rw,
        rt: user.rt,
        citizenId: user.citizenId,
        nik: user.nik,
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });

      const user = await this.userModel.findOne({ _id: payload.sub });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Token tidak valid');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Akun Anda tidak aktif');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Save new refresh token
      user.refreshToken = tokens.refreshToken;
      await user.save();

      return {
        message: 'Token berhasil diperbarui',
        ...tokens,
      };
    } catch (error) {
      this.logger.debug(`Refresh token rejected: ${(error as Error).message}`);
      throw new UnauthorizedException('Token tidak valid atau sudah kadaluarsa');
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string) {
    const user = await this.userModel.findOne({ _id: userId });
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    return {
      message: 'Logout berhasil',
    };
  }

  /**
   * Forgot password - send reset token
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ email: forgotPasswordDto.email });

    if (!user) {
      // Don't reveal if email exists or not (security)
      return {
        message: 'Jika email terdaftar, link reset password telah dikirim',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await this.emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    return {
      message: 'Jika email terdaftar, link reset password telah dikirim',
      // Remove this in production
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetPasswordDto.token)
      .digest('hex');

    const user = await this.userModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new BadRequestException('Token tidak valid atau sudah kadaluarsa');
    }

    // Set new password
    user.password = resetPasswordDto.newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = undefined; // Invalidate refresh token
    await user.save();

    return {
      message: 'Password berhasil direset. Silakan login dengan password baru',
    };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      citizenId: user.citizenId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await this.userModel.findOne({ _id: userId });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      desa: user.desa,
      rw: user.rw,
      rt: user.rt,
      citizenId: user.citizenId,
      nik: user.nik,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel.findOne({ _id: userId });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) throw new BadRequestException('Password lama salah');

    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();

    return { message: 'Password berhasil diubah' };
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    const user = await this.userModel.findOne({ _id: userId });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    if (data.name) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;
    await user.save();

    return {
      message: 'Profil berhasil diperbarui',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        desa: user.desa,
        rw: user.rw,
        rt: user.rt,
        citizenId: user.citizenId,
        nik: user.nik,
      },
    };
  }
}

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
          <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;">WargaHub</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Platform Digital Desa</p>
            </div>

            <!-- Content -->
            <div style="padding:32px;">
              <h2 style="color:#1f2937;margin:0 0 16px;font-size:20px;">Halo, ${name}!</h2>
              <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
                Terima kasih telah mendaftarkan desa Anda di WargaHub. Silakan klik tombol di bawah untuk memverifikasi email dan mengaktifkan akun Anda.
              </p>

              <div style="text-align:center;margin:32px 0;">
                <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:16px;">
                  Verifikasi Email
                </a>
              </div>

              <p style="color:#6b7280;font-size:13px;line-height:1.6;">
                Atau copy link berikut ke browser Anda:<br>
                <a href="${verifyUrl}" style="color:#2563eb;word-break:break-all;">${verifyUrl}</a>
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                Link ini berlaku selama 24 jam. Jika Anda tidak mendaftar di WargaHub, abaikan email ini.
              </p>
            </div>
          </div>

          <p style="text-align:center;color:#9ca3af;font-size:12px;margin:16px 0 0;">
            &copy; ${new Date().getFullYear()} WargaHub. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"WargaHub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verifikasi Email - Registrasi Desa WargaHub',
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to: ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${email}:`, error);
      // Don't throw — registration should still succeed even if email fails
      // In production, queue the email for retry
    }
  }
}

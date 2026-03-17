import * as QRCode from 'qrcode';

export class QrGenerator {
  /**
   * Generate QR code as Data URL (base64)
   */
  static async generateQRCode(data: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Generate QR code verification URL
   */
  static generateVerificationUrl(letterId: string, baseUrl?: string): string {
    const url = baseUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${url}/verify-letter/${letterId}`;
  }

  /**
   * Generate QR code with verification URL
   */
  static async generateLetterQRCode(letterId: string): Promise<string> {
    const verificationUrl = this.generateVerificationUrl(letterId);
    return this.generateQRCode(verificationUrl);
  }
}

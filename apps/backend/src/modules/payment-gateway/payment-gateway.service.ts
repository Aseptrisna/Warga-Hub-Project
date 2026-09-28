import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface CreateGatewayPaymentInput {
  orderId: string;
  amount: number;
  successReturnUrl: string;
  cancelReturnUrl: string;
  expiresInHours?: number;
}

export interface GatewayPayment {
  payment_id: string;
  order_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  payment_link_url: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  expires_at: string;
  completed_at?: string;
}

/**
 * Client for the standalone PaymentGatewayService (QRIS via Sumopod).
 * WargaHub only ever sees the opaque API key/callback secret issued to it
 * as a registered client app — never Sumopod credentials directly.
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly baseUrl = process.env.PAYMENT_GATEWAY_BASE_URL || '';
  private readonly apiKey = process.env.PAYMENT_GATEWAY_API_KEY || '';
  private readonly callbackSecret = process.env.PAYMENT_GATEWAY_CALLBACK_SECRET || '';

  async createPayment(input: CreateGatewayPaymentInput): Promise<GatewayPayment> {
    const res = await this.request('POST', '', {
      order_id: input.orderId,
      amount: input.amount,
      currency: 'IDR',
      expires_in_hours: input.expiresInHours || 24,
      success_return_url: input.successReturnUrl,
      cancel_return_url: input.cancelReturnUrl,
      payment_method_type_code: 'QRIS',
    });
    return res;
  }

  async getPayment(orderId: string): Promise<GatewayPayment> {
    return this.request('GET', `/${encodeURIComponent(orderId)}`);
  }

  private async request(method: 'GET' | 'POST', path: string, body?: any) {
    if (!this.baseUrl || !this.apiKey) {
      throw new BadGatewayException('Payment gateway belum dikonfigurasi (PAYMENT_GATEWAY_BASE_URL/API_KEY kosong)');
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (err) {
      this.logger.error(`Gagal menghubungi payment gateway: ${(err as Error).message}`);
      throw new BadGatewayException('Tidak dapat menghubungi payment gateway');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      this.logger.warn(`Payment gateway responded ${response.status}: ${JSON.stringify(data)}`);
      throw new BadGatewayException(data?.message || `Payment gateway error (${response.status})`);
    }

    return data;
  }

  /**
   * Verifies the HMAC-SHA256 signature of an incoming webhook, per
   * PaymentGatewayService's INTEGRATION.md §4. Must run against the exact
   * raw request bytes, before any JSON re-serialization.
   */
  verifyWebhookSignature(timestamp: string, rawBody: Buffer, signatureHeader: string): boolean {
    if (!this.callbackSecret || !timestamp || !signatureHeader || !rawBody) return false;

    // Reject stale/replayed events (tolerance: 5 minutes).
    const tsSeconds = Number(timestamp);
    if (!Number.isFinite(tsSeconds)) return false;
    const ageSeconds = Math.abs(Date.now() / 1000 - tsSeconds);
    if (ageSeconds > 300) return false;

    const signedContent = `${timestamp}.${rawBody.toString()}`;
    const expected =
      'v1,' + crypto.createHmac('sha256', this.callbackSecret).update(signedContent).digest('base64');

    const expectedBuf = Buffer.from(expected);
    const receivedBuf = Buffer.from(signatureHeader);
    if (expectedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  }
}

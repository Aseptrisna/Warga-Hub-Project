import { Controller, Post, Body, Headers, Req, ForbiddenException } from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiExcludeController } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PaymentGatewayService } from '../payment-gateway/payment-gateway.service';

/**
 * Public webhook receiver for PaymentGatewayService (no JWT - the gateway
 * isn't a logged-in user). Trust is established purely via HMAC signature
 * verification, per INTEGRATION.md §4. Never trust this payload otherwise.
 */
@ApiTags('payments')
@ApiExcludeController()
@Controller('payment-gateway')
export class PaymentWebhookController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly paymentGatewayService: PaymentGatewayService,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
    @Headers('x-gateway-timestamp') timestamp: string,
    @Headers('x-gateway-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody || !this.paymentGatewayService.verifyWebhookSignature(timestamp, rawBody, signature)) {
      throw new ForbiddenException('Invalid webhook signature');
    }

    return this.paymentsService.handleGatewayWebhook(body);
  }
}

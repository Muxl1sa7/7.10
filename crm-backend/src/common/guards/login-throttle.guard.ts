import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// Login endpointi uchun maxsus guard
// 5 daqiqada max 10 ta urinish
@Injectable()
export class LoginThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // IP manzil bo'yicha cheklash
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  protected errorMessage = 'Juda ko\'p urinish. 5 daqiqadan keyin qayta urinib ko\'ring.';
}

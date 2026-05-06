import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Serverda kutilmagan xato yuz berdi';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        // class-validator xatolari massiv bo'ladi
        message = resObj.message || resObj.error || message;
        error = resObj.error || exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;

      // TypeORM xatolari
      if ((exception as any).code === '23505') {
        statusCode = HttpStatus.CONFLICT;
        message = 'Bu ma\'lumot allaqachon mavjud';
        error = 'Conflict';
      } else if ((exception as any).code === '23503') {
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Bog\'liq ma\'lumot topilmadi';
        error = 'Bad Request';
      }
    }

    // 500 xatolarni log ga yozish
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} → ${statusCode}: ${JSON.stringify(message)}`,
      );
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(errorResponse);
  }
}

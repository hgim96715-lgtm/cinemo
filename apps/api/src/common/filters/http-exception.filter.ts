import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

type ExceptionResponse = {
  message?: unknown;
};

function getMessage(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) return value;

  if (Array.isArray(value)) {
    const messages = value.filter(
      (item): item is string => typeof item === 'string' && item.trim() !== '',
    );
    if (messages.length > 0) return messages.join(', ');
  }

  if (value && typeof value === 'object' && 'message' in value) {
    return getMessage((value as ExceptionResponse).message, fallback);
  }

  return fallback;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '요청을 처리하지 못했습니다.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = getMessage(
        exception.getResponse(),
        exception.message || '요청을 처리하지 못했습니다.',
      );
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = '이미 처리된 요청입니다.';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = '요청한 데이터를 찾을 수 없습니다.';
      } else {
        message = '데이터베이스 오류가 발생했습니다.';
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

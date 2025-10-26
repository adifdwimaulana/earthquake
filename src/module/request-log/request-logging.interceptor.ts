import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { catchError, tap, throwError } from 'rxjs';
import { REQUEST_LOG_CONTEXT } from './request-log.decorator';
import { BaseRequestLog } from './request-log.model';
import { RequestLogService } from './request-log.service';
import { transformBaseRequestLogToRecord } from './request-log.transformer';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly requestLogService: RequestLogService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const time = Date.now();

    const route = request.route as { path?: string } | undefined;
    const routePath = typeof route?.path === 'string' ? route.path : undefined;
    const endpoint =
      this.reflector.get<string>(REQUEST_LOG_CONTEXT, context.getHandler()) ??
      routePath ??
      request.url;

    const baseLogPayload: BaseRequestLog = {
      endpoint,
      method: request.method,
      time,
      query: request.query as Record<string, unknown>,
      body: request.body as Record<string, unknown>,
      params: request.params as Record<string, unknown>,
      headers: this.pickRelevantHeaders(request.headers),
      statusCode: response.statusCode,
    };

    return next.handle().pipe(
      tap(() => {
        const record = transformBaseRequestLogToRecord(baseLogPayload);
        void this.requestLogService.ingestLog(record);
      }),
      catchError((error: unknown) => {
        const statusCode = this.extractStatusCode(error);
        const record = transformBaseRequestLogToRecord({
          ...baseLogPayload,
          statusCode,
        });

        void this.requestLogService.ingestLog(record);
        return throwError(() => error);
      }),
    );
  }

  private pickRelevantHeaders(
    headers: Request['headers'],
  ): Record<string, unknown> {
    const whitelist = ['user-agent', 'x-forwarded-for', 'content-type'];
    return whitelist.reduce<Record<string, unknown>>((acc, header) => {
      if (headers[header] !== undefined) {
        acc[header] = headers[header];
      }
      return acc;
    }, {});
  }

  private buildResponseMetadata(result: unknown): Record<string, unknown> {
    if (result === null || result === undefined) {
      return {};
    }

    if (Array.isArray(result)) {
      return { resultType: 'array', length: result.length };
    }

    if (typeof result === 'object') {
      const objectResult = result as Record<string, unknown>;
      const metadata: Record<string, unknown> = { resultType: 'object' };

      if (typeof objectResult.count === 'number') {
        metadata.count = objectResult.count;
      }
      if (typeof objectResult.stored === 'number') {
        metadata.stored = objectResult.stored;
      }
      if (objectResult.nextToken) {
        metadata.hasNext = true;
      }

      return metadata;
    }

    return { resultType: typeof result };
  }

  private extractStatusCode(error: unknown): number {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as { status?: unknown }).status === 'number'
    ) {
      return (error as { status: number }).status;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
    ) {
      return (error as { statusCode: number }).statusCode;
    }

    return 500;
  }

  private extractErrorMessage(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      return (error as { message: string }).message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Unknown error';
  }
}

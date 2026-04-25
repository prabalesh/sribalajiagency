import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();

      // Formatted validation errors from ValidationPipe
      if (typeof exceptionResponse === 'object' && exceptionResponse.message) {
        if (Array.isArray(exceptionResponse.message)) {
          errors = exceptionResponse.message;
          // Join the messages for a single readable string
          message = errors.join(', ');
        } else {
          message = exceptionResponse.message;
        }
      } else {
        message = exception.message;
      }
    } else {
      // Non-HTTP exceptions (like database errors)
      message = exception.message || 'Internal server error';
      this.logger.error(`Unhandled Exception: ${message}`, exception.stack);
    }

    // Log the error for the developer
    if (status >= 400 && status < 500) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`,
      );
    } else {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: message,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
